import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { FarmsService } from './farms.service';
import { CreateFarmDto, UpdateFarmDto, SetIrzCredentialsDto } from './dto/farms.dto';

@ApiTags('farms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('farms')
export class FarmsController {
  constructor(private readonly farmsService: FarmsService) {}

  @Get()
  @ApiOperation({ summary: 'Pobierz gospodarstwa użytkownika' })
  findAll(@Request() req: { user: { id: string } }) {
    return this.farmsService.findByUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Pobierz szczegóły gospodarstwa' })
  findOne(@Param('id') id: string) {
    return this.farmsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Dodaj gospodarstwo' })
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateFarmDto) {
    return this.farmsService.create(req.user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Aktualizuj gospodarstwo' })
  update(@Param('id') id: string, @Body() dto: UpdateFarmDto) {
    return this.farmsService.update(id, dto);
  }

  @Post(':id/irz-credentials')
  @ApiOperation({ summary: 'Ustaw dane logowania IRZ+' })
  setIrzCredentials(@Param('id') id: string, @Body() dto: SetIrzCredentialsDto) {
    return this.farmsService.setIrzCredentials(id, dto);
  }
}


