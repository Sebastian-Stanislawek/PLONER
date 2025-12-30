import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { PdfService } from './pdf.service';
import { IrzModule } from '../irz/irz.module';

@Module({
  imports: [IrzModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, PdfService],
  exports: [DocumentsService],
})
export class DocumentsModule {}


