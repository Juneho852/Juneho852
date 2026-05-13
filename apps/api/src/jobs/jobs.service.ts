import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { JobStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async create(employerUserId: string, dto: CreateJobDto) {
    const employer = await this.prisma.employer.findUnique({
      where: { userId: employerUserId },
    });
    if (!employer) throw new NotFoundException('Employer profile not found');

    if (employer.searchCount >= employer.searchLimit) {
      throw new ForbiddenException(`Search limit reached (${employer.searchLimit} on ${employer.plan} plan)`);
    }

    const job = await this.prisma.job.create({
      data: {
        employerId: employer.id,
        ...dto,
        status: JobStatus.ACTIVE,
      },
    });

    await this.prisma.employer.update({
      where: { id: employer.id },
      data: { searchCount: { increment: 1 } },
    });

    return job;
  }

  async findByEmployer(employerUserId: string) {
    const employer = await this.prisma.employer.findUnique({ where: { userId: employerUserId } });
    return this.prisma.job.findMany({
      where: { employerId: employer.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async updateStatus(id: string, status: JobStatus, employerUserId: string) {
    const employer = await this.prisma.employer.findUnique({ where: { userId: employerUserId } });
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.employerId !== employer.id) throw new ForbiddenException('Not your job');

    return this.prisma.job.update({ where: { id }, data: { status } });
  }
}
