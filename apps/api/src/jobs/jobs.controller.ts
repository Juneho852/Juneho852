import { Controller, Post, Get, Patch, Param, Body } from '@nestjs/common';
import { JobStatus, UserRole } from '@prisma/client';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('jobs')
export class JobsController {
  constructor(private jobs: JobsService) {}

  @Post()
  @Roles(UserRole.EMPLOYER)
  create(@CurrentUser() user: any, @Body() dto: CreateJobDto) {
    return this.jobs.create(user.userId, dto);
  }

  @Get()
  @Roles(UserRole.EMPLOYER)
  findMine(@CurrentUser() user: any) {
    return this.jobs.findByEmployer(user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobs.findOne(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.EMPLOYER)
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: JobStatus,
    @CurrentUser() user: any,
  ) {
    return this.jobs.updateStatus(id, status, user.userId);
  }
}
