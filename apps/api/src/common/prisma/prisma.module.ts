import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ActivityLogService } from '../services/activity-log.service';

@Global()
@Module({
  providers: [PrismaService, ActivityLogService],
  exports: [PrismaService, ActivityLogService],
})
export class PrismaModule {}

