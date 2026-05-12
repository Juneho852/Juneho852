import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { WebhookController } from './webhook.controller';
import { PayoutCronService } from './payout-cron.service';

@Module({
  providers: [PaymentsService, PayoutCronService],
  controllers: [PaymentsController, WebhookController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
