import { Controller, Post, Delete, Get, Body, Param } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CommunicationsService } from './communications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('communications')
export class CommunicationsController {
  constructor(private comms: CommunicationsService) {}

  @Post('proxy')
  @Roles(UserRole.EMPLOYER)
  async createSession(
    @CurrentUser() user: any,
    @Body() body: { helperId: string; isContract?: boolean },
  ) {
    const employer = await this.getEmployerId(user.userId);
    return this.comms.createProxySession(employer, body.helperId, body.isContract);
  }

  @Delete('proxy/:sessionId')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYER)
  deleteSession(@Param('sessionId') sessionId: string) {
    return this.comms.deleteProxySession(sessionId);
  }

  @Get('proxy/:helperId')
  @Roles(UserRole.EMPLOYER)
  async getSession(@CurrentUser() user: any, @Param('helperId') helperId: string) {
    const employer = await this.getEmployerId(user.userId);
    return this.comms.getActiveSession(employer, helperId);
  }

  // Helper to get employer profile ID from user ID
  private async getEmployerId(userId: string): Promise<string> {
    // This is resolved in the service — pass userId and let service resolve
    return userId;
  }
}
