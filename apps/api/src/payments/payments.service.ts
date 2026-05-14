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
    const stripeKey = config.get('STRIPE_SECRET_KEY');
    if (stripeKey) this.stripe = new Stripe(stripeKey);
    this.platformFeePercent = config.get<number>('STRIPE_PLATFORM_FEE_PERCENT', 10);
  }

  async createPaymentIntent(employerId: string, jobId: string, amountHkd: number) {
    if (!this.stripe) throw new BadRequestException('Payment service not configured');
    const employer = await this.prisma.employer.findUnique({ where: { userId: employerId } });
    if (!employer) throw new NotFoundException('Employer not found');

    const amountCents = Math.round(amountHkd * 100);
    const platformFee = Math.round(amountCents * (this.platformFeePercent / 100));
    const idempotencyKey = uuidv4();

    const paymentIntent = await this.stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency: 'hkd',
        capture_method: 'manual',
        metadata: { employerId, jobId, platformFee: platformFee.toString() },
      },
      { idempotencyKey },
    );

    await this.prisma.payment.create({
      data: {
        employerId: employer.id,
        jobId,
        stripePaymentIntentId: paymentIntent.id,
        amount: amountCents,
        platformFee,
        brokerAmount: amountCents - platformFee,
        status: PaymentStatus.PENDING,
        idempotencyKey,
      },
    });

    return { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id };
  }

  async capturePayment(paymentIntentId: string) {
    if (!this.stripe) throw new BadRequestException('Payment service not configured');
    const payment = await this.prisma.payment.findUnique({ where: { stripePaymentIntentId: paymentIntentId } });
    if (!payment) throw new NotFoundException('Payment not found');

    await this.stripe.paymentIntents.capture(paymentIntentId);
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.CAPTURED, capturedAt: new Date() },
    });
    return { success: true };
  }

  async refundPayment(paymentIntentId: string, amountCents?: number) {
    if (!this.stripe) throw new BadRequestException('Payment service not configured');
    const payment = await this.prisma.payment.findUnique({ where: { stripePaymentIntentId: paymentIntentId } });
    if (!payment) throw new NotFoundException('Payment not found');

    const refund = await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amountCents,
    });

    const isPartial = amountCents && amountCents < payment.amount;
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: isPartial ? PaymentStatus.PARTIALLY_REFUNDED : PaymentStatus.REFUNDED,
        refundedAmount: amountCents || payment.amount,
      },
    });

    return { refundId: refund.id };
  }

  async getPaymentsByEmployer(employerId: string) {
    const employer = await this.prisma.employer.findUnique({ where: { userId: employerId } });
    if (!employer) throw new NotFoundException('Employer not found');
    return this.prisma.payment.findMany({
      where: { employerId: employer.id },
      orderBy: { createdAt: 'desc' },
    });
  }
}
