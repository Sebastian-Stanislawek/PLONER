import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { ActivityLogService } from '@/common/services/activity-log.service';

export interface DashboardStats {
  animalsCount: number;
  animalsBySpecies: Record<string, number>;
  pendingDocuments: number;
  submittedDocuments: number;
  lastSyncAt: Date | null;
  syncStatus: string;
}

export interface ActivityItem {
  id: string;
  type: 'SYNC' | 'DOCUMENT' | 'ANIMAL';
  action: string;
  description: string;
  createdAt: Date;
}

export interface Reminder {
  id: string;
  type: 'BIRTH' | 'DEATH' | 'TRANSFER';
  message: string;
  dueDate: Date;
  daysLeft: number;
  animalId?: string;
  earTagNumber?: string;
}

export interface ActivityLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async getStats(farmId: string): Promise<DashboardStats> {
    const [farm, animalsCount, animalsBySpecies, pendingDocs, submittedDocs] = await Promise.all([
      this.prisma.farm.findUnique({ where: { id: farmId } }),
      this.prisma.animal.count({ where: { farmId, status: 'ACTIVE' } }),
      this.prisma.animal.groupBy({
        by: ['species'],
        where: { farmId, status: 'ACTIVE' },
        _count: true,
      }),
      this.prisma.document.count({ where: { farmId, status: 'DRAFT' } }),
      this.prisma.document.count({ where: { farmId, status: 'SUBMITTED' } }),
    ]);

    const speciesCounts: Record<string, number> = {};
    for (const item of animalsBySpecies) {
      speciesCounts[item.species] = item._count;
    }

    return {
      animalsCount,
      animalsBySpecies: speciesCounts,
      pendingDocuments: pendingDocs,
      submittedDocuments: submittedDocs,
      lastSyncAt: farm?.lastSyncAt || null,
      syncStatus: farm?.syncStatus || 'PENDING',
    };
  }

  async getRecentActivity(farmId: string): Promise<ActivityItem[]> {
    const activities: ActivityItem[] = [];

    // Ostatnie synchronizacje
    const syncLogs = await this.prisma.syncLog.findMany({
      where: { farmId },
      orderBy: { startedAt: 'desc' },
      take: 5,
    });

    for (const log of syncLogs) {
      activities.push({
        id: log.id,
        type: 'SYNC',
        action: log.status === 'COMPLETED' ? 'Synchronizacja zakończona' : 'Synchronizacja',
        description: log.status === 'COMPLETED' 
          ? `Zsynchronizowano ${log.entitiesSynced} zwierząt`
          : log.errorMessage || 'W trakcie...',
        createdAt: log.startedAt,
      });
    }

    // Ostatnie dokumenty
    const documents = await this.prisma.document.findMany({
      where: { farmId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { animal: { select: { earTagNumber: true } } },
    });

    for (const doc of documents) {
      const typeLabels: Record<string, string> = {
        DEATH_REPORT: 'Zgłoszenie padnięcia',
        BIRTH_REPORT: 'Zgłoszenie urodzenia',
        TRANSFER_REPORT: 'Zgłoszenie przemieszczenia',
      };

      activities.push({
        id: doc.id,
        type: 'DOCUMENT',
        action: typeLabels[doc.type] || doc.type,
        description: doc.animal?.earTagNumber 
          ? `Zwierzę: ${doc.animal.earTagNumber}` 
          : 'Dokument utworzony',
        createdAt: doc.createdAt,
      });
    }

    // Sortuj po dacie
    return activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 10);
  }

  async getReminders(farmId: string): Promise<Reminder[]> {
    const reminders: Reminder[] = [];
    const now = new Date();

    // Przypomnienia o urodzeniach - zwierzęta bez zgłoszenia urodzenia w ciągu 7 dni
    const recentAnimals = await this.prisma.animal.findMany({
      where: {
        farmId,
        status: 'ACTIVE',
        birthDate: {
          gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // ostatnie 14 dni
        },
      },
      include: {
        documents: { where: { type: 'BIRTH_REPORT' } },
      },
    });

    for (const animal of recentAnimals) {
      if (animal.documents.length === 0 && animal.birthDate) {
        const dueDate = new Date(animal.birthDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

        if (daysLeft <= 7 && daysLeft >= -7) {
          reminders.push({
            id: `birth-${animal.id}`,
            type: 'BIRTH',
            message: daysLeft > 0 
              ? `Zgłoś urodzenie w ciągu ${daysLeft} dni`
              : `Termin zgłoszenia urodzenia minął ${Math.abs(daysLeft)} dni temu!`,
            dueDate,
            daysLeft,
            animalId: animal.id,
            earTagNumber: animal.earTagNumber,
          });
        }
      }
    }

    // Przypomnienia o padnięciach - dokumenty DRAFT starsze niż 3 dni
    const draftDeathReports = await this.prisma.document.findMany({
      where: {
        farmId,
        type: 'DEATH_REPORT',
        status: 'DRAFT',
        createdAt: { lt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
      },
      include: { animal: { select: { earTagNumber: true } } },
    });

    for (const doc of draftDeathReports) {
      const daysOld = Math.floor((now.getTime() - doc.createdAt.getTime()) / (24 * 60 * 60 * 1000));
      
      reminders.push({
        id: `death-${doc.id}`,
        type: 'DEATH',
        message: `Wyślij zgłoszenie padnięcia (utworzone ${daysOld} dni temu)`,
        dueDate: new Date(doc.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000),
        daysLeft: 7 - daysOld,
        animalId: doc.animalId || undefined,
        earTagNumber: doc.animal?.earTagNumber,
      });
    }

    // Przypomnienia o przemieszczeniach - dokumenty DRAFT typu TRANSFER
    const draftTransferReports = await this.prisma.document.findMany({
      where: {
        farmId,
        type: 'TRANSFER_REPORT',
        status: 'DRAFT',
      },
      include: { animal: { select: { earTagNumber: true } } },
    });

    for (const doc of draftTransferReports) {
      const daysOld = Math.floor((now.getTime() - doc.createdAt.getTime()) / (24 * 60 * 60 * 1000));
      
      reminders.push({
        id: `transfer-${doc.id}`,
        type: 'TRANSFER',
        message: `Wyślij zgłoszenie przemieszczenia (utworzone ${daysOld} dni temu)`,
        dueDate: new Date(doc.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000),
        daysLeft: 7 - daysOld,
        animalId: doc.animalId || undefined,
        earTagNumber: doc.animal?.earTagNumber,
      });
    }

    return reminders.sort((a, b) => a.daysLeft - b.daysLeft);
  }

  async getUserActivityLogs(userId: string, limit = 50): Promise<ActivityLogItem[]> {
    const logs = await this.activityLogService.getByUser(userId, limit);
    
    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      metadata: log.metadata as Record<string, unknown> | null,
      createdAt: log.createdAt,
    }));
  }
}

