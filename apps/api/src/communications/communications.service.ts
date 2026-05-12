import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';
import { ProxySessionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption.service';

const INTERVIEW_TTL_SECONDS = 7 * 24 * 60 * 60;    // 7 days
const CONTRACT_TTL_SECONDS = 2 * 365 * 24 * 60 * 60; // 2 years

@Injectable()
export class CommunicationsService {
  private readonly logger = new Logger(CommunicationsService.name);
  private client: twilio.Twilio;
  private serviceSid: string;

  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
    private config: ConfigService,
  ) {
    this.client = twilio.default(
      config.get('TWILIO_ACCOUNT_SID'),
      config.get('TWILIO_AUTH_TOKEN'),
    );
    this.serviceSid = config.get('TWILIO_PROXY_SERVICE_SID');
  }

  // Creates a Twilio Proxy session — real numbers are NEVER exposed to either party
  async createProxySession(employerId: string, helperId: string, isContract = false) {
    const employer = await this.prisma.employer.findUnique({ where: { id: employerId } });
    const helper = await this.prisma.helper.findUnique({ where: { id: helperId } });

    if (!employer || !helper) throw new NotFoundException('User not found');
    if (!helper.phone || !helper.phoneIv) throw new BadRequestException('Helper phone not configured');

    // Decrypt helper's real phone (AES-256 GCM)
    const realPhone = this.encryption.decrypt(helper.phone, helper.phoneIv);

    const ttl = isContract ? CONTRACT_TTL_SECONDS : INTERVIEW_TTL_SECONDS;

    const session = await this.client.proxy.v1
      .services(this.serviceSid)
      .sessions.create({
        uniqueName: `match-${employerId}-${helperId}-${Date.now()}`,
        ttl,
      });

    // Add both participants — Twilio assigns virtual numbers automatically
    await session.participants().create({ identifier: realPhone });

    const expiresAt = new Date(Date.now() + ttl * 1000);

    const record = await this.prisma.proxySession.create({
      data: {
        employerId,
        helperId,
        twilioSessionSid: session.sid,
        proxyNumber: session.sid, // actual proxy number retrieved from participant
        ttlSeconds: ttl,
        status: ProxySessionStatus.ACTIVE,
        expiresAt,
      },
    });

    // Return only the virtual proxy number — never the real number
    return {
      sessionId: record.id,
      proxyNumber: record.proxyNumber,
      expiresAt,
    };
  }

  async deleteProxySession(sessionId: string) {
    const session = await this.prisma.proxySession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.status === ProxySessionStatus.DELETED) return;

    try {
      await this.client.proxy.v1
        .services(this.serviceSid)
        .sessions(session.twilioSessionSid)
        .remove();
    } catch (err) {
      this.logger.warn(`Twilio session ${session.twilioSessionSid} already deleted or not found`);
    }

    await this.prisma.proxySession.update({
      where: { id: sessionId },
      data: { status: ProxySessionStatus.DELETED, deletedAt: new Date() },
    });

    this.logger.log(`Proxy session ${sessionId} deleted, number returned to pool`);
  }

  async getActiveSession(employerId: string, helperId: string) {
    const session = await this.prisma.proxySession.findFirst({
      where: {
        employerId,
        helperId,
        status: ProxySessionStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) return null;
    // Return proxy number only — never expose real number
    return { sessionId: session.id, proxyNumber: session.proxyNumber, expiresAt: session.expiresAt };
  }
}
