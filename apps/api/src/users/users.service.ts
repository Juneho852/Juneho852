import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { UpdateHelperProfileDto } from './dto/update-helper-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
  ) {}

  async getHelperProfile(helperId: string) {
    const helper = await this.prisma.helper.findUnique({
      where: { id: helperId },
      select: {
        id: true,
        fullName: true,
        nationality: true,
        yearsExperience: true,
        languages: true,
        cookingTypes: true,
        hasPetCare: true,
        hasDriving: true,
        childrenExperience: true,
        elderlyExperience: true,
        mbtiType: true,
        profilePhotoUrl: true,
        isVetted: true,
        aiVettingScore: true,
        // phone is NEVER returned — encrypted in DB
      },
    });
    if (!helper) throw new NotFoundException('Helper not found');
    return helper;
  }

  async updateHelperProfile(userId: string, dto: UpdateHelperProfileDto) {
    const helper = await this.prisma.helper.findUnique({ where: { userId } });
    if (!helper) throw new NotFoundException('Helper profile not found');

    const updateData: any = { ...dto };

    // If phone is being updated, encrypt it
    if (dto.phone) {
      const { encrypted, iv } = this.encryption.encrypt(dto.phone);
      updateData.phone = encrypted;
      updateData.phoneIv = iv;
      delete updateData.phone; // remove plaintext
      updateData.phone = encrypted;
    }

    return this.prisma.helper.update({
      where: { id: helper.id },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        nationality: true,
        yearsExperience: true,
        languages: true,
        // phone excluded
      },
    });
  }

  // Broker uploads helpers in bulk — phone encrypted for each
  async bulkUploadHelpers(brokerId: string, helpers: any[]) {
    const broker = await this.prisma.broker.findUnique({ where: { userId: brokerId } });
    if (!broker) throw new NotFoundException('Broker not found');

    const created = [];
    for (const h of helpers) {
      const { encrypted, iv } = this.encryption.encrypt(h.phone);
      const user = await this.prisma.user.create({
        data: { email: h.email, passwordHash: '', role: UserRole.HELPER },
      });
      const helper = await this.prisma.helper.create({
        data: {
          userId: user.id,
          fullName: h.fullName,
          phone: encrypted,
          phoneIv: iv,
          nationality: h.nationality,
          yearsExperience: h.yearsExperience || 0,
          languages: h.languages || [],
          cookingTypes: h.cookingTypes || [],
          brokerId: broker.id,
        },
      });
      created.push({ id: helper.id, fullName: helper.fullName });
    }
    return { created: created.length, helpers: created };
  }

  async getBrokerHelpers(brokerUserId: string) {
    const broker = await this.prisma.broker.findUnique({ where: { userId: brokerUserId } });
    if (!broker) throw new NotFoundException('Broker not found');

    return this.prisma.helper.findMany({
      where: { brokerId: broker.id },
      select: {
        id: true,
        fullName: true,
        nationality: true,
        yearsExperience: true,
        isVetted: true,
        aiVettingScore: true,
        isProfileVisible: true,
        // phone never returned
      },
    });
  }

  async getAdminUsers(role?: UserRole) {
    return this.prisma.user.findMany({
      where: role ? { role } : undefined,
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleUserActive(userId: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, email: true, isActive: true },
    });
  }
}
