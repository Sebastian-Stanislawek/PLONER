import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats/:farmId')
  @ApiOperation({ summary: 'Pobierz statystyki gospodarstwa' })
  getStats(@Param('farmId') farmId: string) {
    return this.dashboardService.getStats(farmId);
  }

  @Get('activity/:farmId')
  @ApiOperation({ summary: 'Pobierz ostatnie aktywności' })
  getActivity(@Param('farmId') farmId: string) {
    return this.dashboardService.getRecentActivity(farmId);
  }

  @Get('reminders/:farmId')
  @ApiOperation({ summary: 'Pobierz przypomnienia' })
  getReminders(@Param('farmId') farmId: string) {
    return this.dashboardService.getReminders(farmId);
  }

  @Get('activity-logs')
  @ApiOperation({ summary: 'Pobierz logi aktywności użytkownika' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getActivityLogs(
    @Request() req: { user: { sub: string } },
    @Query('limit') limit?: string,
  ) {
    return this.dashboardService.getUserActivityLogs(
      req.user.sub,
      limit ? parseInt(limit, 10) : 50,
    );
  }
}

