import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateFarmDto {
  @ApiProperty({ example: '123456789' })
  @IsString()
  producerNumber: string;

  @ApiProperty({ example: 'PL123456789' })
  @IsString()
  herdNumber: string;

  @ApiPropertyOptional({ example: 'Gospodarstwo Kowalski' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'ul. Wiejska 1, 00-001 Warszawa' })
  @IsString()
  @IsOptional()
  address?: string;
}

export class UpdateFarmDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;
}

export class SetIrzCredentialsDto {
  @ApiProperty({ example: 'login_irz' })
  @IsString()
  irzLogin: string;

  @ApiProperty({ example: 'haslo_irz' })
  @IsString()
  irzPassword: string;
}


