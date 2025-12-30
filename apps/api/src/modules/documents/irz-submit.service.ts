import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { IrzAuthService } from '../irz/irz-auth.service';
import { PrismaService } from '@/common/prisma/prisma.service';

interface DeathReportPayload {
  numerKolczyka: string;
  dataPadniecia: string;
  przyczynaPadniecia: string;
  sposobUtylizacji: string;
  numerProducenta: string;
}

@Injectable()
export class IrzSubmitService {
  private readonly logger = new Logger(IrzSubmitService.name);
  private readonly baseUrl: string;
  private readonly isTestMode: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly authService: IrzAuthService,
    private readonly prisma: PrismaService,
  ) {
    this.baseUrl = this.config.get('IRZ_API_BASE_URL') || 'https://irz.arimr.gov.pl/api';
    this.isTestMode = this.config.get('NODE_ENV') !== 'production';
  }

  async submitDeathReport(
    documentId: string,
    username: string,
    password: string,
  ): Promise<{ success: boolean; documentNumber?: string; error?: string }> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { animal: true, farm: true },
    });

    if (!document) {
      throw new Error('Dokument nie znaleziony');
    }

    const formData = document.formData as Record<string, string>;
    const token = await this.authService.getToken(username, password);

    const endpoint = this.isTestMode
      ? '/indywidualne/dokument/api/test/zpzu'
      : '/indywidualne/dokument/api/prod/zpzu';

    const payload: DeathReportPayload = {
      numerKolczyka: formData.earTagNumber,
      dataPadniecia: formData.deathDate,
      przyczynaPadniecia: this.mapDeathCause(formData.deathCause),
      sposobUtylizacji: this.mapDisposalMethod(formData.disposalMethod),
      numerProducenta: formData.producerNumber,
    };

    try {
      const response = await axios.post(`${this.baseUrl}${endpoint}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      const documentNumber = response.data?.numerDokumentu || `ZPZU-${Date.now()}`;

      this.logger.log(`Zgłoszenie wysłane: ${documentNumber}`);

      return { success: true, documentNumber };
    } catch (error) {
      const message = (error as Error).message;
      this.logger.error(`Błąd wysyłki do IRZ+: ${message}`);
      return { success: false, error: message };
    }
  }

  private mapDeathCause(cause: string): string {
    const mapping: Record<string, string> = {
      NATURAL: 'NATURALNA',
      DISEASE: 'CHOROBA',
      ACCIDENT: 'WYPADEK',
      EUTHANASIA: 'EUTANAZJA',
      UNKNOWN: 'NIEZNANA',
    };
    return mapping[cause] || cause;
  }

  private mapDisposalMethod(method: string): string {
    const mapping: Record<string, string> = {
      RENDERING_PLANT: 'ZAKLAD_UTYLIZACYJNY',
      BURIAL: 'POCHOWEK',
      VETERINARY: 'BADANIA_WETERYNARYJNE',
    };
    return mapping[method] || method;
  }
}


