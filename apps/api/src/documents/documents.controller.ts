import { Controller, Get, Post, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { UserRole } from '@prisma/client';
import { DocumentsService } from './documents.service';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('documents')
export class DocumentsController {
  constructor(private docs: DocumentsService) {}

  @Get(':contractId/id407')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYER, UserRole.BROKER)
  async downloadId407(@Param('contractId') id: string, @Res() res: Response) {
    const pdf = await this.docs.generateId407(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ID407_${id}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }

  @Post(':contractId/ssa/send')
  @Roles(UserRole.ADMIN)
  sendSsa(@Param('contractId') id: string) {
    return this.docs.sendSsaForSignature(id);
  }

  @Get(':paymentId/escrow-release')
  @Roles(UserRole.ADMIN, UserRole.BROKER, UserRole.EMPLOYER)
  async downloadEscrowRelease(@Param('paymentId') id: string, @Res() res: Response) {
    const pdf = await this.docs.generateEscrowReleaseNotice(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="EscrowRelease_${id}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }
}
