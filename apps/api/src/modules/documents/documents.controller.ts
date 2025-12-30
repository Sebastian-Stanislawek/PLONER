import { Controller, Get, Post, Body, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { DocumentsService } from './documents.service';
import { CreateDeathReportDto, CreateBirthReportDto, CreateTransferReportDto } from './dto/documents.dto';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('farm/:farmId')
  @ApiOperation({ summary: 'Pobierz dokumenty gospodarstwa' })
  findByFarm(@Param('farmId') farmId: string) {
    return this.documentsService.findByFarm(farmId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Pobierz szczegóły dokumentu' })
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Post('death-report')
  @ApiOperation({ summary: 'Utwórz zgłoszenie padnięcia' })
  createDeathReport(@Body() dto: CreateDeathReportDto) {
    return this.documentsService.createDeathReport(dto);
  }

  @Post('birth-report')
  @ApiOperation({ summary: 'Utwórz zgłoszenie urodzenia' })
  createBirthReport(@Body() dto: CreateBirthReportDto) {
    return this.documentsService.createBirthReport(dto);
  }

  @Post('transfer-report')
  @ApiOperation({ summary: 'Utwórz zgłoszenie przemieszczenia' })
  createTransferReport(@Body() dto: CreateTransferReportDto) {
    return this.documentsService.createTransferReport(dto);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Wyślij dokument do IRZ+' })
  submitToIrz(@Param('id') id: string) {
    return this.documentsService.submitToIrz(id);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Pobierz PDF dokumentu' })
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const { buffer, filename } = await this.documentsService.generatePdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}

