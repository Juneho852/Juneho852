import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe;
  private platformFeePercent: number;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.stripe = new Stripe(config.get('STRIPE_SECRET_KEY'));
    this.platformFeePercent = config.get<number>('STRIPE_PLATFORM_FEE_PERCENT', 10);
  }

  // Employer initiates payment — funds held in escrow (manual capture)
  async createPaymentIntent(employerId: string, jobId: string, amountHkd: number) {
    const employer = await this.prisma.employer.findUnique({ where: { userId: employerId } });
    if (!employer) throw new NotFoundException('Employer not found');

    const amountCents = Math.round(amountHkd * 100);
    const platformFee = Math.round(amountCents * (this.platformFeePercent / 100));
    const idempotencyKey = uuidv4();

    const intent = await this.stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency: 'hkd',
        capture_method: 'manual', // CRITICAL: authorize only, do not auto-capture
        customer: employer.stripeCustomerId || undefined,
        metadata: { employerId, jobId },
      },
      { idempotencyKey },
    );

    await this.prisma.payment.create({
      data: {
        employerId: employer.id,
        jobId,
        stripePaymentIntentId: intent.id,
        amount: amountCents,
        platformFee,
        brokerAmount: amountCents - platformFee,
        status: PaymentStatus.PENDING,
        idempotencyKey,
      },
    });

    return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
  }

  // Called after visa confirmation — capture the authorized funds and split
  async captureAndTransfer(paymentId: string, brokerId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== PaymentStatus.AUTHORIZED) {
      throw new BadRequestException('Payment not in authorized state');
    }

    const broker = await this.prisma.broker.findUnique({ where: { id: brokerId } });
    if (!broker?.stripeAccountId) throw new BadRequestException('Broker Stripe account not connected');

    // Capture the payment
    await this.stripe.paymentIntents.capture(payment.stripePaymentIntentId);

    // Destination charge transfer to broker's connected account
    const transfer = await this.stripe.transfers.create({
      amount: payment.brokerAmount,
      currency: 'hkd',
      destination: broker.stripeAccountId,
      transfer_group: payment.stripePaymentIntentId,
      metadata: { paymentId: payment.id, brokerId },
    });

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.CAPTURED,
        stripeTransferId: transfer.id,
        capturedAt: new Date(),
        transferredAt: new Date(),
        brokerId,
        hireConfirmedAt: new Date(),
      },
    });

    return { success: true, transferId: transfer.id };
  }

  // Prorated refund when helper is dismissed mid-contract
  // proratedRefund = (daysRemaining / contractDays) × amount
  async processPartialRefund(paymentId: string, daysWorked: number, totalContractDays: number) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== PaymentStatus.CAPTURED) {
      throw new BadRequestException('Can only refund captured payments');
    }

    const daysRemaining = totalContractDays - daysWorked;
    if (daysRemaining <= 0) throw new BadRequestException('No days remaining to refund');

    const refundAmount = Math.round(
      (daysRemaining / totalContractDays) * payment.brokerAmount,
    );

    await this.stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      amount: refundAmount,
      reason: 'requested_by_customer',
      metadata: { paymentId, daysWorked: String(daysWorked), daysRemaining: String(daysRemaining) },
    });

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.PARTIALLY_REFUNDED,
        refundedAmount: refundAmount,
      },
    });

    return { refundedAmount: refundAmount / 100, currency: 'hkd' };
  }

  // Release authorized funds back to employer if visa not confirmed
  async releaseToEmployer(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.status !== PaymentStatus.AUTHORIZED) return;

    await this.stripe.paymentIntents.cancel(payment.stripePaymentIntentId);
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.REFUNDED },
    });
    this.logger.log(`Released payment ${paymentId} back to employer`);
  }

  // Stripe Connect: initiate broker onboarding
  async createBrokerConnectAccount(brokerId: string, email: string) {
    const account = await this.stripe.accounts.create({
      type: 'express',
      email,
      capabilities: { transfers: { requested: true } },
      business_type: 'company',
      metadata: { brokerId },
    });

    const link = await this.stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${this.config.get('FRONTEND_URL')}/broker/stripe/refresh`,
      return_url: `${this.config.get('FRONTEND_URL')}/broker/stripe/success`,
      type: 'account_onboarding',
    });

    await this.prisma.broker.update({
      where: { id: brokerId },
      data: { stripeAccountId: account.id },
    });

    return { accountId: account.id, onboardingUrl: link.url };
  }

  async getPaymentsByEmployer(employerId: string) {
    const employer = await this.prisma.employer.findUnique({ where: { userId: employerId } });
    return this.prisma.payment.findMany({
      where: { employerId: employer.id },
      orderBy: { createdAt: 'desc' },
    });
  }
}
