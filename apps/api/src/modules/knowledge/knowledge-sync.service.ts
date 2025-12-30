import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeCategory } from '@prisma/client';

interface SyncTopic {
  category: KnowledgeCategory;
  topic: string;
}

@Injectable()
export class KnowledgeSyncService {
  private readonly logger = new Logger(KnowledgeSyncService.name);

  private readonly syncTopics: SyncTopic[] = [
    { category: 'LEGAL', topic: 'rejestracja zwierząt gospodarskich' },
    { category: 'LEGAL', topic: 'znakowanie bydła' },
    { category: 'IRZ_PROCEDURES', topic: 'zgłaszanie urodzeń zwierząt' },
    { category: 'IRZ_PROCEDURES', topic: 'zgłaszanie padnięć zwierząt' },
    { category: 'IRZ_PROCEDURES', topic: 'przemieszczanie zwierząt' },
    { category: 'DEADLINES', topic: 'terminy zgłoszeń do IRZ' },
    { category: 'DEADLINES', topic: 'obowiązkowe badania weterynaryjne' },
    { category: 'SUBSIDIES', topic: 'dopłaty do bydła 2024' },
    { category: 'SUBSIDIES', topic: 'program dobrostanu zwierząt' },
    { category: 'ANIMAL_HEALTH', topic: 'profilaktyka chorób bydła' },
    { category: 'ANIMAL_HEALTH', topic: 'ASF świnie' },
  ];

  constructor(private knowledgeService: KnowledgeService) {}

  // Codziennie o 6:00 rano
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async syncKnowledgeBase() {
    this.logger.log('Rozpoczynam synchronizację bazy wiedzy...');

    for (const { category, topic } of this.syncTopics) {
      try {
        await this.knowledgeService.syncCategoryArticles(category, topic);
        this.logger.log(`Zsynchronizowano: ${category} - ${topic}`);

        // Pauza między zapytaniami (rate limiting)
        await this.delay(2000);
      } catch (error) {
        this.logger.error(`Błąd synchronizacji ${category} - ${topic}`, error);
      }
    }

    this.logger.log('Synchronizacja bazy wiedzy zakończona');
  }

  // Ręczne wywołanie synchronizacji
  async manualSync(category?: KnowledgeCategory) {
    const topics = category
      ? this.syncTopics.filter((t) => t.category === category)
      : this.syncTopics;

    for (const { category: cat, topic } of topics) {
      try {
        await this.knowledgeService.syncCategoryArticles(cat, topic);
        await this.delay(2000);
      } catch (error) {
        this.logger.error(`Błąd synchronizacji ${cat} - ${topic}`, error);
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}


