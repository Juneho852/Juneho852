import { Module } from '@nestjs/common';
import { CommunicationsService } from './communications.service';
import { CommunicationsController } from './communications.controller';
import { ProxyExpiryService } from './proxy-expiry.service';

@Module({
  providers: [CommunicationsService, ProxyExpiryService],
  controllers: [CommunicationsController],
  exports: [CommunicationsService],
})
export class CommunicationsModule {}
