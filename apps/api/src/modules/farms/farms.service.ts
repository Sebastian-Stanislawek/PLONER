import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateFarmDto, UpdateFarmDto, SetIrzCredentialsDto } from './dto/farms.dto';

@Injectable()
export class FarmsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: string) {
    return this.prisma.farm.findMany({
      where: { userId },
      include: { _count: { select: { animals: true } } },
    });
  }

  async findOne(id: string) {
    const farm = await this.prisma.farm.findUnique({
      where: { id },
      include: { _count: { select: { animals: true } } },
    });
    if (!farm) throw new NotFoundException('Gospodarstwo nie znalezione');
    return farm;
  }

  async create(userId: string, dto: CreateFarmDto) {
    return this.prisma.farm.create({
      data: { ...dto, userId },
    });
  }

  async update(id: string, dto: UpdateFarmDto) {
    return this.prisma.farm.update({
      where: { id },
      data: dto,
    });
  }

  async setIrzCredentials(farmId: string, dto: SetIrzCredentialsDto) {
    const farm = await this.prisma.farm.findUnique({
      where: { id: farmId },
      select: { userId: true },
    });

    if (!farm) throw new NotFoundException('Gospodarstwo nie znalezione');

    // TODO: Zaszyfrować hasło AES-256-GCM przed zapisem
    const encrypted = Buffer.from(dto.irzPassword).toString('base64');

    await this.prisma.user.update({
      where: { id: farm.userId },
      data: { irzLogin: dto.irzLogin, irzPassEnc: encrypted },
    });

    return { message: 'Dane IRZ+ zapisane' };
  }
}

