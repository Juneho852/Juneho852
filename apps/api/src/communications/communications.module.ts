import { Module } from '@nestjs/common';
import { CommunicationsService } from './communications.service';
import { CommunicationsController } from './communications.controller';
import { ProxyExpiryService } from './proxy-expiry.service';
import { EncryptionService } from '../common/encryption.service';

@Module({
  providers: [CommunicationsService, ProxyExpiryService, EncryptionService],
  controllers: [CommunicationsController],
  exports: [CommunicationsService],
})
export class CommunicationsModule {}
