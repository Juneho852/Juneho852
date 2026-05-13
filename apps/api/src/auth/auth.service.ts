import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role,
      },
    });

    // Create role-specific profile
    if (dto.role === UserRole.EMPLOYER) {
      await this.prisma.employer.create({
        data: { userId: user.id, fullName: dto.fullName || '' },
      });
    } else if (dto.role === UserRole.HELPER) {
      await this.prisma.helper.create({
        data: {
          userId: user.id,
          fullName: dto.fullName || '',
          phone: dto.phone || '',
          phoneIv: '',
          nationality: dto.nationality || '',
        },
      });
    } else if (dto.role === UserRole.BROKER) {
      await this.prisma.broker.create({
        data: {
          userId: user.id,
          agencyName: dto.agencyName || '',
          licenseNumber: dto.licenseNumber || '',
        },
      });
    }

    const token = this.signToken(user.id, user.email, user.role);
    return { accessToken: token, userId: user.id, role: user.role };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account suspended');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  async login(user: any) {
    if (user.mfaEnabled) {
      return { requiresMfa: true, userId: user.id };
    }
    const token = this.signToken(user.id, user.email, user.role);
    return { accessToken: token, role: user.role, userId: user.id };
  }

  async verifyMfa(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.mfaSecret) throw new BadRequestException('MFA not configured');

    const valid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1,
    });
    if (!valid) throw new UnauthorizedException('Invalid MFA token');

    const accessToken = this.signToken(user.id, user.email, user.role);
    return { accessToken, role: user.role, userId: user.id };
  }

  async setupMfa(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const secret = speakeasy.generateSecret({ name: `MatchAI:${user.email}` });

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret.base32 },
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);
    return { secret: secret.base32, qrCode };
  }

  async enableMfa(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const valid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
    });
    if (!valid) throw new BadRequestException('Invalid token');

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });
    return { message: 'MFA enabled successfully' };
  }

  private signToken(userId: string, email: string, role: UserRole) {
    return this.jwt.sign({ sub: userId, email, role });
  }
}
