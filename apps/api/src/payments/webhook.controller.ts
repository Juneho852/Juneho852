import {
  Controller,
  Post,
  Req,
  Headers,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import Stripe from 'stripe';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.stripe = new Stripe(config.get('STRIPE_SECRET_KEY'));
  }

  @Public()
  @Post('stripe')
  async handleStripeWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') sig: string,
  ) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        (req as any).rawBody,
        sig,
        this.config.get('STRIPE_WEBHOOK_SECRET'),
      );
    } catch (err) {
      throw new BadRequestException(`Webhook signature failed: ${err.message}`);
    }

    // Idempotency check — skip already-processed events
    const existing = await this.prisma.webhookEvent.findUnique({
      where: { eventId: event.id },
    });
    if (existing?.processed) {
      this.logger.log(`Skipping already-processed event ${event.id}`);
      return { received: true };
    }

    // Record event (upsert so concurrent requests are safe)
    await this.prisma.webhookEvent.upsert({
      where: { eventId: event.id },
      create: { eventId: event.id, eventType: event.type, payload: event as any },
      update: {},
    });

    try {
      await this.processEvent(event);
      await this.prisma.webhookEvent.update({
        where: { eventId: event.id },
        data: { processed: true, processedAt: new Date() },
      });
    } catch (err) {
      this.logger.error(`Failed to process event ${event.id}`, err);
    }

    return { received: true };
  }

  private async processEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'payment_intent.amount_capturable_updated': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.prisma.payment.updateMany({
          where: { stripePaymentIntentId: pi.id },
          data: { status: PaymentStatus.AUTHORIZED },
        });
        break;
      }

      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.prisma.payment.updateMany({
          where: { stripePaymentIntentId: pi.id },
          data: { status: PaymentStatus.CAPTURED, capturedAt: new Date() },
        });
        break;
      }

      case 'transfer.created': {
        const transfer = event.data.object as Stripe.Transfer;
        this.logger.log(`Transfer created: ${transfer.id}`);
        break;
      }

      case 'payout.failed': {
        const payout = event.data.object as Stripe.Payout;
        this.logger.error(`Payout failed: ${payout.id}, reason: ${payout.failure_message}`);
        // Notify admin via internal alert
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.prisma.payment.updateMany({
          where: { stripePaymentIntentId: pi.id },
          data: { status: PaymentStatus.FAILED },
        });
        break;
      }

      default:
        this.logger.debug(`Unhandled event type: ${event.type}`);
    }
  }
}
