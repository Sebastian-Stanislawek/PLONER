import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AnimalsService } from './animals.service';
import { GetAnimalsDto } from './dto/animals.dto';

@ApiTags('animals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('animals')
export class AnimalsController {
  constructor(private readonly animalsService: AnimalsService) {}

  @Get('farm/:farmId')
  @ApiOperation({ summary: 'Pobierz zwierzęta gospodarstwa' })
  @ApiQuery({ name: 'species', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  findByFarm(@Param('farmId') farmId: string, @Query() query: GetAnimalsDto) {
    return this.animalsService.findByFarm(farmId, query);
  }

  @Get('farm/:farmId/species/:species')
  @ApiOperation({ summary: 'Pobierz zwierzęta danego gatunku' })
  findBySpecies(
    @Param('farmId') farmId: string,
    @Param('species') species: string,
    @Query() query: GetAnimalsDto,
  ) {
    return this.animalsService.findByFarm(farmId, { ...query, species });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Pobierz szczegóły zwierzęcia' })
  findOne(@Param('id') id: string) {
    return this.animalsService.findOne(id);
  }
}


