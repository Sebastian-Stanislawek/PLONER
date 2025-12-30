import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IrzService } from './irz.service';
import { IrzAuthService } from './irz-auth.service';

@Module({
  imports: [ConfigModule],
  providers: [IrzService, IrzAuthService],
  exports: [IrzService, IrzAuthService],
})
export class IrzModule {}


