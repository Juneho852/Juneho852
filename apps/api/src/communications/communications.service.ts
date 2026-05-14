import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilioLib from 'twilio';
import { ProxySessionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption.service';

const INTERVIEW_TTL_SECONDS = 7 * 24 * 60 * 60;
const CONTRACT_TTL_SECONDS = 2 * 365 * 24 * 60 * 60;

@Injectable()
export class CommunicationsService {
  private readonly logger = new Logger(CommunicationsService.name);
  private client: any;
  private serviceSid: string;

  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
    private config: ConfigService,
  ) {
    const sid = config.get('TWILIO_ACCOUNT_SID');
    const token = config.get('TWILIO_AUTH_TOKEN');
    if (sid && token) {
      const twilioFn = (twilioLib as any).default ?? twilioLib;
      this.client = twilioFn(sid, token);
    } else {
      this.logger.warn('Twilio credentials not set — phone proxy disabled');
    }
    this.serviceSid = config.get('TWILIO_PROXY_SERVICE_SID');
  }

  async createProxySession(employerId: string, helperId: string, isContract = false) {
    if (!this.client) throw new BadRequestException('Phone proxy service not configured');
    const employer = await this.prisma.employer.findUnique({ where: { id: employerId } });
    const helper = await this.prisma.helper.findUnique({ where: { id: helperId } });
    if (!employer || !helper) throw new NotFoundException('User not found');

    const ttl = isContract ? CONTRACT_TTL_SECONDS : INTERVIEW_TTL_SECONDS;
    const decryptedPhone = this.encryption.decrypt(helper.phone, helper.phoneIv);
    const employerPhone = employer.phone ? this.encryption.decrypt(employer.phone, employer.phoneIv) : null;

    const session = await this.client.proxy.v1.services(this.serviceSid).sessions.create({
      ttl,
      participants: [
        { identifier: employerPhone || '+85200000000' },
        { identifier: decryptedPhone },
      ],
    });

    const proxyNumber = session.links?.participants?.[0]?.proxyIdentifier || 'N/A';

    await this.prisma.proxySession.create({
      data: {
        employerId,
        helperId,
        twilioSessionSid: session.sid,
        proxyNumber,
        ttlSeconds: ttl,
        expiresAt: new Date(Date.now() + ttl * 1000),
      },
    });

    return { sessionId: session.sid, proxyNumber, expiresAt: new Date(Date.now() + ttl * 1000) };
  }

  async deleteProxySession(sessionId: string) {
    if (!this.client) throw new BadRequestException('Phone proxy service not configured');
    await this.client.proxy.v1.services(this.serviceSid).sessions(sessionId).remove();
    await this.prisma.proxySession.update({
      where: { twilioSessionSid: sessionId },
      data: { status: ProxySessionStatus.DELETED, deletedAt: new Date() },
    });
    return { success: true };
  }
}
