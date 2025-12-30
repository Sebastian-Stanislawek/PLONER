import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@/common/prisma/prisma.service';
import { IrzService, NormalizedAnimal } from '../irz/irz.service';
import { IrzAuthService } from '../irz/irz-auth.service';
import { Species } from '@prisma/client';

interface SyncJobData {
  farmId: string;
  syncLogId: string;
}

@Processor('sync-queue')
export class SyncAnimalsProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncAnimalsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly irzService: IrzService,
    private readonly irzAuthService: IrzAuthService,
  ) {
    super();
  }

  async process(job: Job<SyncJobData>): Promise<{ synced: number }> {
    const { farmId, syncLogId } = job.data;
    this.logger.log(`Rozpoczynam synchronizację dla gospodarstwa: ${farmId}`);

    try {
      await this.updateSyncStatus(syncLogId, 'IN_PROGRESS');
      await job.updateProgress(10);

      const farm = await this.prisma.farm.findUnique({
        where: { id: farmId },
        include: { user: true },
      });

      if (!farm) throw new Error('Gospodarstwo nie znalezione');
      if (!farm.user.irzLogin || !farm.user.irzPassEnc) {
        throw new Error('Brak danych logowania IRZ+');
      }

      const password = this.decryptPassword(farm.user.irzPassEnc);
      await job.updateProgress(20);

      const allAnimals: NormalizedAnimal[] = [];

      // Pobierz zwierzęta indywidualne (bydło, owce, kozy, jelenie, wielbłądy)
      try {
        const individual = await this.irzService.fetchAnimalsIndividual(
          farm.user.irzLogin,
          password,
          farm.producerNumber,
        );
        allAnimals.push(...individual);
        this.logger.log(`Pobrano ${individual.length} zwierząt indywidualnych`);
      } catch (e) {
        this.logger.warn(`Błąd pobierania zwierząt indywidualnych: ${(e as Error).message}`);
      }
      await job.updateProgress(40);

      // Pobierz świnie
      try {
        const pigs = await this.irzService.fetchAnimalsPigs(
          farm.user.irzLogin,
          password,
          farm.producerNumber,
        );
        allAnimals.push(...pigs);
        this.logger.log(`Pobrano ${pigs.length} świń`);
      } catch (e) {
        this.logger.warn(`Błąd pobierania świń: ${(e as Error).message}`);
      }
      await job.updateProgress(60);

      // Pobierz koniowate
      try {
        const horses = await this.irzService.fetchAnimalsHorses(
          farm.user.irzLogin,
          password,
          farm.producerNumber,
        );
        allAnimals.push(...horses);
        this.logger.log(`Pobrano ${horses.length} koniowatych`);
      } catch (e) {
        this.logger.warn(`Błąd pobierania koniowatych: ${(e as Error).message}`);
      }
      await job.updateProgress(80);

      // Zapisz do bazy
      const synced = await this.upsertAnimals(farmId, allAnimals);
      await job.updateProgress(95);

      // Aktualizuj status
      await this.prisma.farm.update({
        where: { id: farmId },
        data: { lastSyncAt: new Date(), syncStatus: 'COMPLETED' },
      });

      await this.updateSyncStatus(syncLogId, 'COMPLETED', synced);
      await job.updateProgress(100);

      this.logger.log(`Synchronizacja zakończona: ${synced} zwierząt`);
      return { synced };
    } catch (error) {
      const message = (error as Error).message;
      this.logger.error(`Błąd synchronizacji: ${message}`);

      await this.updateSyncStatus(syncLogId, 'FAILED', 0, message);
      await this.prisma.farm.update({
        where: { id: farmId },
        data: { syncStatus: 'FAILED' },
      });

      throw error;
    }
  }

  private async upsertAnimals(farmId: string, animals: NormalizedAnimal[]): Promise<number> {
    let synced = 0;

    for (const animal of animals) {
      if (!animal.earTagNumber) continue;

      await this.prisma.animal.upsert({
        where: { farmId_earTagNumber: { farmId, earTagNumber: animal.earTagNumber } },
        create: {
          farmId,
          irzId: animal.irzId,
          earTagNumber: animal.earTagNumber,
          species: animal.species as Species,
          breed: animal.breed,
          gender: animal.gender,
          birthDate: animal.birthDate ? new Date(animal.birthDate) : null,
          motherEarTag: animal.motherEarTag,
          status: 'ACTIVE',
          syncedAt: new Date(),
        },
        update: {
          irzId: animal.irzId,
          breed: animal.breed,
          syncedAt: new Date(),
        },
      });
      synced++;
    }

    return synced;
  }

  private async updateSyncStatus(
    syncLogId: string,
    status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED',
    entitiesSynced = 0,
    errorMessage?: string,
  ) {
    await this.prisma.syncLog.update({
      where: { id: syncLogId },
      data: {
        status,
        entitiesSynced,
        errorMessage,
        completedAt: status !== 'IN_PROGRESS' ? new Date() : null,
      },
    });
  }

  private decryptPassword(encrypted: string): string {
    // TODO: Implementacja prawdziwego szyfrowania AES-256-GCM
    return Buffer.from(encrypted, 'base64').toString('utf-8');
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} zakończony pomyślnie`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} zakończony błędem: ${error.message}`);
  }
}


