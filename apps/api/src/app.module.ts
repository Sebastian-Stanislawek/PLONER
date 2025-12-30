import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { FarmsModule } from './modules/farms/farms.module';
import { AnimalsModule } from './modules/animals/animals.module';
import { SyncModule } from './modules/sync/sync.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    FarmsModule,
    AnimalsModule,
    SyncModule,
    DocumentsModule,
    DashboardModule,
    KnowledgeModule,
  ],
})
export class AppModule {}

