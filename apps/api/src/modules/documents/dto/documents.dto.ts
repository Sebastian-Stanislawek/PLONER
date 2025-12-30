import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsDateString, IsEnum, IsOptional } from 'class-validator';

export enum DeathCause {
  NATURAL = 'NATURAL',
  DISEASE = 'DISEASE',
  ACCIDENT = 'ACCIDENT',
  EUTHANASIA = 'EUTHANASIA',
  UNKNOWN = 'UNKNOWN',
}

export enum DisposalMethod {
  RENDERING_PLANT = 'RENDERING_PLANT',
  BURIAL = 'BURIAL',
  VETERINARY = 'VETERINARY',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum Species {
  CATTLE = 'CATTLE',
  SHEEP = 'SHEEP',
  GOAT = 'GOAT',
  PIG = 'PIG',
  HORSE = 'HORSE',
  POULTRY = 'POULTRY',
  DEER = 'DEER',
  CAMEL = 'CAMEL',
}

export class CreateDeathReportDto {
  @ApiProperty({ description: 'ID zwierzęcia' })
  @IsString()
  animalId: string;

  @ApiProperty({ description: 'Data padnięcia', example: '2024-01-15' })
  @IsDateString()
  deathDate: string;

  @ApiProperty({ enum: DeathCause, description: 'Przyczyna padnięcia' })
  @IsEnum(DeathCause)
  deathCause: DeathCause;

  @ApiPropertyOptional({ description: 'Miejsce padnięcia' })
  @IsString()
  @IsOptional()
  deathPlace?: string;

  @ApiProperty({ enum: DisposalMethod, description: 'Sposób utylizacji' })
  @IsEnum(DisposalMethod)
  disposalMethod: DisposalMethod;
}

export class CreateBirthReportDto {
  @ApiProperty({ description: 'ID gospodarstwa' })
  @IsString()
  farmId: string;

  @ApiProperty({ description: 'Numer kolczyka noworodka' })
  @IsString()
  earTagNumber: string;

  @ApiProperty({ enum: Species, description: 'Gatunek' })
  @IsEnum(Species)
  species: Species;

  @ApiProperty({ enum: Gender, description: 'Płeć' })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ description: 'Data urodzenia', example: '2024-01-15' })
  @IsDateString()
  birthDate: string;

  @ApiPropertyOptional({ description: 'Rasa' })
  @IsString()
  @IsOptional()
  breed?: string;

  @ApiPropertyOptional({ description: 'ID matki (jeśli w systemie)' })
  @IsString()
  @IsOptional()
  motherId?: string;

  @ApiPropertyOptional({ description: 'Numer kolczyka matki' })
  @IsString()
  @IsOptional()
  motherEarTag?: string;
}

export enum TransferDirection {
  IN = 'IN',   // Przyjęcie do gospodarstwa
  OUT = 'OUT', // Wydanie z gospodarstwa
}

export class CreateTransferReportDto {
  @ApiProperty({ description: 'ID zwierzęcia' })
  @IsString()
  animalId: string;

  @ApiProperty({ enum: TransferDirection, description: 'Kierunek przemieszczenia' })
  @IsEnum(TransferDirection)
  direction: TransferDirection;

  @ApiProperty({ description: 'Data przemieszczenia', example: '2024-01-15' })
  @IsDateString()
  transferDate: string;

  @ApiProperty({ description: 'Numer producenta docelowego/źródłowego' })
  @IsString()
  otherProducerNumber: string;

  @ApiProperty({ description: 'Numer siedziby stada docelowej/źródłowej' })
  @IsString()
  otherHerdNumber: string;

  @ApiPropertyOptional({ description: 'Nazwa gospodarstwa docelowego/źródłowego' })
  @IsString()
  @IsOptional()
  otherFarmName?: string;

  @ApiPropertyOptional({ description: 'Powód przemieszczenia' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ description: 'Numer dokumentu przewozowego' })
  @IsString()
  @IsOptional()
  transportDocNumber?: string;
}

