import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { Species, AnimalStatus, Prisma } from '@prisma/client';
import { GetAnimalsDto } from './dto/animals.dto';

@Injectable()
export class AnimalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByFarm(farmId: string, filters: GetAnimalsDto) {
    const { species, status, search, page = 1, pageSize = 20 } = filters;

    const where: Prisma.AnimalWhereInput = {
      farmId,
      ...(species && { species: species as Species }),
      ...(status && { status: status as AnimalStatus }),
      ...(search && {
        OR: [
          { earTagNumber: { contains: search, mode: 'insensitive' } },
          { breed: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.animal.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.animal.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const animal = await this.prisma.animal.findUnique({
      where: { id },
      include: { 
        events: { orderBy: { eventDate: 'desc' } },
        documents: { 
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            status: true,
            createdAt: true,
            submittedAt: true,
            irzDocNumber: true,
          },
        },
        farm: {
          select: {
            id: true,
            name: true,
            producerNumber: true,
          },
        },
      },
    });
    if (!animal) throw new NotFoundException('Zwierzę nie znalezione');
    return animal;
  }

  async syncFromIrz(farmId: string, irzAnimals: IrzAnimalData[]) {
    const operations = irzAnimals.map((animal) =>
      this.prisma.animal.upsert({
        where: { farmId_earTagNumber: { farmId, earTagNumber: animal.earTagNumber } },
        create: {
          farmId,
          irzId: animal.irzId,
          earTagNumber: animal.earTagNumber,
          species: animal.species as Species,
          breed: animal.breed,
          gender: animal.gender,
          birthDate: animal.birthDate ? new Date(animal.birthDate) : null,
          motherEarTag: animal.motherEarTag,
          syncedAt: new Date(),
        },
        update: {
          irzId: animal.irzId,
          breed: animal.breed,
          syncedAt: new Date(),
        },
      }),
    );

    return this.prisma.$transaction(operations);
  }
}

interface IrzAnimalData {
  irzId: string;
  earTagNumber: string;
  species: string;
  breed?: string;
  gender: 'MALE' | 'FEMALE';
  birthDate?: string;
  motherEarTag?: string;
}

