import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { PerplexityService } from './perplexity.service';
import { KnowledgeSyncService } from './knowledge-sync.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [KnowledgeController],
  providers: [KnowledgeService, PerplexityService, KnowledgeSyncService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}


