import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetAnimalsDto {
  @ApiPropertyOptional({ enum: ['CATTLE', 'SHEEP', 'GOAT', 'PIG', 'POULTRY', 'HORSE'] })
  @IsString()
  @IsOptional()
  species?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'DECEASED', 'SOLD', 'SLAUGHTERED'] })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number;
}


