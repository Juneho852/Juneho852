import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from './payments.service';

@Injectable()
export class PayoutCronService {
  private readonly logger = new Logger(PayoutCronService.name);

  constructor(
    private prisma: PrismaService,
    private payments: PaymentsService,
  ) {}

  // Runs daily at 2am HKT — checks visa status and handles 30-day hold logic
  @Cron('0 2 * * *', { timeZone: 'Asia/Hong_Kong' })
  async processPendingPayouts() {
    this.logger.log('Processing pending payout releases...');

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Find authorized payments where visa is confirmed (hire date set > 30 days ago)
    const releasable = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.AUTHORIZED,
        hireConfirmedAt: { lte: thirtyDaysAgo },
        brokerId: { not: null },
      },
    });

    for (const payment of releasable) {
      try {
        await this.payments.captureAndTransfer(payment.id, payment.brokerId);
        this.logger.log(`Released payout for payment ${payment.id}`);
      } catch (err) {
        // Log failure but continue — do NOT skip other payments
        this.logger.error(`Payout failed for payment ${payment.id}`, err.message);
      }
    }

    // Find authorized payments past 30 days with no visa confirmation — release to employer
    const expired = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.AUTHORIZED,
        createdAt: { lte: thirtyDaysAgo },
        hireConfirmedAt: null,
      },
    });

    for (const payment of expired) {
      try {
        await this.payments.releaseToEmployer(payment.id);
        this.logger.log(`Expired payment ${payment.id} released to employer`);
      } catch (err) {
        this.logger.error(`Release failed for payment ${payment.id}`, err.message);
      }
    }

    this.logger.log(
      `Processed ${releasable.length} payouts, released ${expired.length} expired holds`,
    );
  }
}
