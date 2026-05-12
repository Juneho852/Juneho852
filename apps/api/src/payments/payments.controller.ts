import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Post('intent')
  @Roles(UserRole.EMPLOYER)
  createIntent(
    @CurrentUser() user: any,
    @Body() body: { jobId: string; amountHkd: number },
  ) {
    return this.payments.createPaymentIntent(user.userId, body.jobId, body.amountHkd);
  }

  @Get('my')
  @Roles(UserRole.EMPLOYER)
  getMyPayments(@CurrentUser() user: any) {
    return this.payments.getPaymentsByEmployer(user.userId);
  }

  @Post(':id/refund')
  @Roles(UserRole.ADMIN)
  refund(
    @Param('id') id: string,
    @Body() body: { daysWorked: number; totalContractDays: number },
  ) {
    return this.payments.processPartialRefund(id, body.daysWorked, body.totalContractDays);
  }

  @Post('broker/connect')
  @Roles(UserRole.BROKER)
  connectBroker(@CurrentUser() user: any, @Body() body: { email: string }) {
    return this.payments.createBrokerConnectAccount(user.userId, body.email);
  }
}
