import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { MatchingService } from './matching.service';
import { RunMatchingDto } from './dto/run-matching.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('matching')
export class MatchingController {
  constructor(private matchingService: MatchingService) {}

  @Post('run')
  @Roles(UserRole.EMPLOYER)
  async runMatching(@CurrentUser() user: any, @Body() dto: RunMatchingDto) {
    return this.matchingService.runMatching(user.userId, dto);
  }

  @Get('results/:jobId')
  @Roles(UserRole.EMPLOYER)
  async getResults(@CurrentUser() user: any, @Param('jobId') jobId: string) {
    return this.matchingService.getMatchResults(user.userId, jobId);
  }
}
