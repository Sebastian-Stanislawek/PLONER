import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class StartSyncDto {
  @ApiProperty({ description: 'ID gospodarstwa do synchronizacji' })
  @IsString()
  farmId: string;
}


