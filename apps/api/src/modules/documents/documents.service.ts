import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { ActivityLogService } from '@/common/services/activity-log.service';
import { PdfService } from './pdf.service';
import { IrzSubmitService } from './irz-submit.service';
import { CreateDeathReportDto, CreateBirthReportDto, CreateTransferReportDto } from './dto/documents.dto';
import { Species, Gender } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
    private readonly activityLog: ActivityLogService,
  ) {}

  async findByFarm(farmId: string) {
    return this.prisma.document.findMany({
      where: { farmId },
      include: { animal: { select: { earTagNumber: true, species: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: {
        animal: true,
        farm: { select: { userId: true, producerNumber: true, herdNumber: true, name: true } },
      },
    });
    if (!doc) throw new NotFoundException('Dokument nie znaleziony');
    return doc;
  }

  async createDeathReport(dto: CreateDeathReportDto) {
    const animal = await this.prisma.animal.findUnique({
      where: { id: dto.animalId },
      include: { farm: true },
    });

    if (!animal) throw new NotFoundException('Zwierzę nie znalezione');

    const formData = {
      animalId: dto.animalId,
      earTagNumber: animal.earTagNumber,
      species: animal.species,
      breed: animal.breed,
      deathDate: dto.deathDate,
      deathCause: dto.deathCause,
      deathPlace: dto.deathPlace || 'GOSPODARSTWO',
      disposalMethod: dto.disposalMethod,
      producerNumber: animal.farm.producerNumber,
      herdNumber: animal.farm.herdNumber,
    };

    const document = await this.prisma.document.create({
      data: {
        farmId: animal.farmId,
        animalId: dto.animalId,
        type: 'DEATH_REPORT',
        status: 'DRAFT',
        formData,
      },
      include: { animal: true },
    });

    // Aktualizuj status zwierzęcia
    await this.prisma.animal.update({
      where: { id: dto.animalId },
      data: { status: 'DECEASED' },
    });

    // Log activity
    await this.activityLog.log(
      animal.farm.userId,
      'DOCUMENT_CREATE',
      'DOCUMENT',
      document.id,
      { type: 'DEATH_REPORT', earTagNumber: animal.earTagNumber },
    );

    return document;
  }

  async submitToIrz(documentId: string) {
    const doc = await this.findOne(documentId);

    if (doc.status !== 'DRAFT' && doc.status !== 'ERROR') {
      throw new BadRequestException('Dokument został już wysłany');
    }

    // Aktualizuj status na PENDING
    await this.prisma.document.update({
      where: { id: documentId },
      data: { status: 'PENDING' },
    });

    try {
      // TODO: Implementacja wysyłki do IRZ+ przez IrzSubmitService
      // const result = await this.irzSubmitService.submitDeathReport(doc);

      // Symulacja sukcesu (do zastąpienia prawdziwą implementacją)
      const irzDocNumber = `ZPZU/${new Date().getFullYear()}/${Date.now()}`;

      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'SUBMITTED',
          irzDocNumber,
          submittedAt: new Date(),
          irzResponseData: { success: true, documentNumber: irzDocNumber },
        },
      });

      // Log activity
      await this.activityLog.log(
        doc.farm.userId,
        'DOCUMENT_SUBMIT',
        'DOCUMENT',
        documentId,
        { type: doc.type, irzDocNumber },
      );

      return { success: true, documentNumber: irzDocNumber };
    } catch (error) {
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'ERROR',
          irzResponseData: { error: (error as Error).message },
        },
      });

      throw error;
    }
  }

  async generatePdf(documentId: string): Promise<{ buffer: Buffer; filename: string }> {
    const doc = await this.findOne(documentId);

    const pdfData = {
      formData: doc.formData as Record<string, string>,
      farm: doc.farm,
      animal: doc.animal,
      createdAt: doc.createdAt,
    };

    let buffer: Buffer;
    let filename: string;

    if (doc.type === 'DEATH_REPORT') {
      buffer = await this.pdfService.generateDeathReport(pdfData);
      filename = `zgloszenie_padniecia_${doc.animal?.earTagNumber || doc.id}.pdf`;
    } else if (doc.type === 'BIRTH_REPORT') {
      buffer = await this.pdfService.generateBirthReport(pdfData);
      filename = `zgloszenie_urodzenia_${pdfData.formData.earTagNumber || doc.id}.pdf`;
    } else if (doc.type === 'TRANSFER_REPORT') {
      buffer = await this.pdfService.generateTransferReport(pdfData);
      filename = `zgloszenie_przemieszczenia_${doc.animal?.earTagNumber || doc.id}.pdf`;
    } else {
      throw new BadRequestException('Generowanie PDF niedostępne dla tego typu dokumentu');
    }

    return { buffer, filename };
  }

  async createBirthReport(dto: CreateBirthReportDto) {
    const farm = await this.prisma.farm.findUnique({
      where: { id: dto.farmId },
    });

    if (!farm) throw new NotFoundException('Gospodarstwo nie znalezione');

    // Sprawdź czy kolczyk już istnieje
    const existingAnimal = await this.prisma.animal.findFirst({
      where: { earTagNumber: dto.earTagNumber },
    });

    if (existingAnimal) {
      throw new ConflictException('Zwierzę z tym numerem kolczyka już istnieje');
    }

    // Pobierz dane matki jeśli podano
    let mother = null;
    if (dto.motherId) {
      mother = await this.prisma.animal.findUnique({
        where: { id: dto.motherId },
      });
    }

    const formData = {
      earTagNumber: dto.earTagNumber,
      species: dto.species,
      gender: dto.gender,
      birthDate: dto.birthDate,
      breed: dto.breed,
      motherEarTag: dto.motherEarTag || mother?.earTagNumber,
      motherId: dto.motherId,
      producerNumber: farm.producerNumber,
      herdNumber: farm.herdNumber,
    };

    // Utwórz nowe zwierzę
    const animal = await this.prisma.animal.create({
      data: {
        farmId: dto.farmId,
        earTagNumber: dto.earTagNumber,
        species: dto.species as Species,
        gender: dto.gender as Gender,
        birthDate: new Date(dto.birthDate),
        breed: dto.breed,
        motherEarTag: dto.motherEarTag || mother?.earTagNumber,
        status: 'ACTIVE',
      },
    });

    // Utwórz dokument zgłoszenia urodzenia
    const document = await this.prisma.document.create({
      data: {
        farmId: dto.farmId,
        animalId: animal.id,
        type: 'BIRTH_REPORT',
        status: 'DRAFT',
        formData,
      },
      include: { animal: true },
    });

    // Dodaj zdarzenie urodzenia
    await this.prisma.animalEvent.create({
      data: {
        animalId: animal.id,
        eventType: 'BIRTH',
        eventDate: new Date(dto.birthDate),
        description: `Urodzenie - matka: ${dto.motherEarTag || mother?.earTagNumber || 'nieznana'}`,
      },
    });

    // Log activity
    await this.activityLog.log(
      farm.userId,
      'DOCUMENT_CREATE',
      'DOCUMENT',
      document.id,
      { type: 'BIRTH_REPORT', earTagNumber: dto.earTagNumber },
    );

    await this.activityLog.log(
      farm.userId,
      'ANIMAL_CREATE',
      'ANIMAL',
      animal.id,
      { earTagNumber: dto.earTagNumber, species: dto.species },
    );

    return document;
  }

  async createTransferReport(dto: CreateTransferReportDto) {
    const animal = await this.prisma.animal.findUnique({
      where: { id: dto.animalId },
      include: { farm: true },
    });

    if (!animal) throw new NotFoundException('Zwierzę nie znalezione');

    const formData = {
      animalId: dto.animalId,
      earTagNumber: animal.earTagNumber,
      species: animal.species,
      breed: animal.breed,
      direction: dto.direction,
      transferDate: dto.transferDate,
      otherProducerNumber: dto.otherProducerNumber,
      otherHerdNumber: dto.otherHerdNumber,
      otherFarmName: dto.otherFarmName,
      reason: dto.reason,
      transportDocNumber: dto.transportDocNumber,
      producerNumber: animal.farm.producerNumber,
      herdNumber: animal.farm.herdNumber,
    };

    const document = await this.prisma.document.create({
      data: {
        farmId: animal.farmId,
        animalId: dto.animalId,
        type: 'TRANSFER_REPORT',
        status: 'DRAFT',
        formData,
      },
      include: { animal: true },
    });

    // Dodaj zdarzenie przemieszczenia
    const eventType = dto.direction === 'OUT' ? 'TRANSFER_OUT' : 'TRANSFER_IN';
    await this.prisma.animalEvent.create({
      data: {
        animalId: animal.id,
        eventType,
        eventDate: new Date(dto.transferDate),
        description: dto.direction === 'OUT'
          ? `Wydanie do: ${dto.otherProducerNumber} (${dto.otherFarmName || 'brak nazwy'})`
          : `Przyjęcie z: ${dto.otherProducerNumber} (${dto.otherFarmName || 'brak nazwy'})`,
      },
    });

    // Jeśli wydanie - zmień status zwierzęcia na SOLD
    if (dto.direction === 'OUT') {
      await this.prisma.animal.update({
        where: { id: dto.animalId },
        data: { status: 'SOLD' },
      });
    }

    // Log activity
    await this.activityLog.log(
      animal.farm.userId,
      'DOCUMENT_CREATE',
      'DOCUMENT',
      document.id,
      { type: 'TRANSFER_REPORT', earTagNumber: animal.earTagNumber, direction: dto.direction },
    );

    return document;
  }
}

