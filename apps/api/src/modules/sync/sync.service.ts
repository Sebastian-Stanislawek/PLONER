import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@/common/prisma/prisma.service';
import { ActivityLogService } from '@/common/services/activity-log.service';

@Injectable()
export class SyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
    @InjectQueue('sync-queue') private readonly syncQueue: Queue,
  ) {}

  async startSync(farmId: string) {
    const farm = await this.prisma.farm.findUnique({ where: { id: farmId } });
    
    const syncLog = await this.prisma.syncLog.create({
      data: {
        farmId,
        direction: 'PULL',
        status: 'PENDING',
      },
    });

    const job = await this.syncQueue.add('sync-animals', {
      farmId,
      syncLogId: syncLog.id,
    });

    await this.prisma.farm.update({
      where: { id: farmId },
      data: { syncStatus: 'IN_PROGRESS' },
    });

    // Log activity
    if (farm) {
      await this.activityLog.log(farm.userId, 'SYNC_START', 'SYNC', syncLog.id, { farmId });
    }

    return { jobId: job.id, status: 'IN_PROGRESS' };
  }

  async getStatus(jobId: string) {
    const job = await this.syncQueue.getJob(jobId);
    if (!job) return { jobId, status: 'NOT_FOUND' };

    const state = await job.getState();
    return {
      jobId,
      status: state.toUpperCase(),
      progress: job.progress,
      result: job.returnvalue,
    };
  }

  async getLogs(farmId: string) {
    return this.prisma.syncLog.findMany({
      where: { farmId },
      orderBy: { startedAt: 'desc' },
      take: 20,
    });
  }
}

