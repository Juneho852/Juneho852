import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProxySessionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CommunicationsService } from './communications.service';

@Injectable()
export class ProxyExpiryService {
  private readonly logger = new Logger(ProxyExpiryService.name);
  private isRunning = false;

  constructor(
    private prisma: PrismaService,
    private comms: CommunicationsService,
  ) {}

  // Runs every hour — expire and clean up proxy sessions
  @Cron(CronExpression.EVERY_HOUR)
  async expireProxySessions() {
    // Prevent concurrent runs if a previous job is still processing
    if (this.isRunning) {
      this.logger.warn('Proxy expiry cron already running, skipping');
      return;
    }

    this.isRunning = true;
    try {
      const expired = await this.prisma.proxySession.findMany({
        where: {
          status: ProxySessionStatus.ACTIVE,
          expiresAt: { lte: new Date() },
        },
      });

      this.logger.log(`Found ${expired.length} expired proxy sessions to clean up`);

      for (const session of expired) {
        try {
          await this.comms.deleteProxySession(session.id);
        } catch (err) {
          // Mark as expired even if Twilio deletion fails — number may already be released
          this.logger.error(`Failed to delete session ${session.id}`, err.message);
          await this.prisma.proxySession.update({
            where: { id: session.id },
            data: { status: ProxySessionStatus.EXPIRED },
          });
        }
      }
    } finally {
      this.isRunning = false;
    }
  }
}
