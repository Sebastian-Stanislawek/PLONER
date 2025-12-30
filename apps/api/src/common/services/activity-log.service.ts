import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type ActivityAction = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'REGISTER'
  | 'FARM_CREATE'
  | 'FARM_UPDATE'
  | 'FARM_IRZ_CONNECT'
  | 'ANIMAL_CREATE'
  | 'ANIMAL_UPDATE'
  | 'ANIMAL_DELETE'
  | 'DOCUMENT_CREATE'
  | 'DOCUMENT_SUBMIT'
  | 'DOCUMENT_PDF'
  | 'SYNC_START'
  | 'SYNC_COMPLETE'
  | 'SYNC_FAIL';

export type EntityType = 'USER' | 'FARM' | 'ANIMAL' | 'DOCUMENT' | 'SYNC';

@Injectable()
export class ActivityLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    userId: string,
    action: ActivityAction,
    entityType: EntityType,
    entityId?: string,
    metadata?: Record<string, unknown>,
  ) {
    try {
      await this.prisma.activityLog.create({
        data: {
          userId,
          action,
          entityType,
          entityId,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        },
      });
    } catch (error) {
      // Nie blokuj głównej operacji jeśli logowanie się nie powiedzie
      console.error('ActivityLog error:', error);
    }
  }

  async getByUser(userId: string, limit = 50) {
    return this.prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getByEntity(entityType: EntityType, entityId: string, limit = 50) {
    return this.prisma.activityLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

