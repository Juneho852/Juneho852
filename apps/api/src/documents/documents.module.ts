import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { EncryptionService } from '../common/encryption.service';

@Module({
  providers: [DocumentsService, EncryptionService],
  controllers: [DocumentsController],
  exports: [DocumentsService],
})
export class DocumentsModule {}
