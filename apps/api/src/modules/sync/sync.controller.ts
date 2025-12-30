import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { SyncService } from './sync.service';
import { StartSyncDto } from './dto/sync.dto';

@ApiTags('sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('start')
  @ApiOperation({ summary: 'Rozpocznij synchronizację z IRZ+' })
  startSync(@Body() dto: StartSyncDto) {
    return this.syncService.startSync(dto.farmId);
  }

  @Get('status/:jobId')
  @ApiOperation({ summary: 'Sprawdź status synchronizacji' })
  getStatus(@Param('jobId') jobId: string) {
    return this.syncService.getStatus(jobId);
  }

  @Get('logs/:farmId')
  @ApiOperation({ summary: 'Historia synchronizacji gospodarstwa' })
  getLogs(@Param('farmId') farmId: string) {
    return this.syncService.getLogs(farmId);
  }
}


