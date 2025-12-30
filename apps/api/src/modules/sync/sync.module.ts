import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { SyncAnimalsProcessor } from './sync-animals.processor';
import { AnimalsModule } from '../animals/animals.module';
import { IrzModule } from '../irz/irz.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST') || 'localhost',
          port: config.get('REDIS_PORT') || 6379,
        },
      }),
    }),
    BullModule.registerQueue({ name: 'sync-queue' }),
    AnimalsModule,
    IrzModule,
  ],
  controllers: [SyncController],
  providers: [SyncService, SyncAnimalsProcessor],
})
export class SyncModule {}

