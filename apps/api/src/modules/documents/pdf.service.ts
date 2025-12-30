import { Injectable } from '@nestjs/common';

interface ReportData {
  formData: Record<string, string>;
  farm: {
    producerNumber: string;
    herdNumber: string;
    name?: string | null;
  };
  animal?: {
    earTagNumber: string;
    species: string;
    breed?: string | null;
    birthDate?: Date | null;
    gender: string;
  } | null;
  createdAt: Date;
}

const SPECIES_NAMES: Record<string, string> = {
  CATTLE: 'Bydło',
  SHEEP: 'Owce',
  GOAT: 'Kozy',
  PIG: 'Świnie',
  HORSE: 'Koniowate',
  POULTRY: 'Drób',
  DEER: 'Jeleniowate',
  CAMEL: 'Wielbłądowate',
};

const GENDER_NAMES: Record<string, string> = {
  MALE: 'Samiec',
  FEMALE: 'Samica',
};

@Injectable()
export class PdfService {
  async generateDeathReport(data: ReportData): Promise<Buffer> {
    const content = this.buildDeathReportContent(data);
    return Buffer.from(content);
  }

  async generateBirthReport(data: ReportData): Promise<Buffer> {
    const content = this.buildBirthReportContent(data);
    return Buffer.from(content);
  }

  async generateTransferReport(data: ReportData): Promise<Buffer> {
    const content = this.buildTransferReportContent(data);
    return Buffer.from(content);
  }

  private buildDeathReportContent(data: ReportData): string {
    const { formData, farm } = data;

    const disposalNames: Record<string, string> = {
      RENDERING_PLANT: 'Zakład utylizacyjny',
      BURIAL: 'Pochówek na terenie gospodarstwa',
      VETERINARY: 'Przekazano do badań weterynaryjnych',
    };

    const deathCauseNames: Record<string, string> = {
      NATURAL: 'Przyczyny naturalne',
      DISEASE: 'Choroba',
      ACCIDENT: 'Wypadek',
      EUTHANASIA: 'Eutanazja',
      UNKNOWN: 'Nieznana',
    };

    const date = new Date(formData.deathDate).toLocaleDateString('pl-PL');
    const createdDate = new Date(data.createdAt).toLocaleDateString('pl-PL');

    return this.buildPdf('ZGLOSZENIE PADNIECIA ZWIERZECIA', [
      'Formularz ZPZU - Zgloszenie padniecia/zabicia/uboju',
      '',
      'DANE GOSPODARSTWA:',
      `Nr producenta: ${formData.producerNumber}`,
      `Nr siedziby stada: ${formData.herdNumber}`,
      `Nazwa: ${farm?.name || '-'}`,
      '',
      'DANE ZWIERZECIA:',
      `Nr kolczyka: ${formData.earTagNumber}`,
      `Gatunek: ${SPECIES_NAMES[formData.species] || formData.species}`,
      `Rasa: ${formData.breed || '-'}`,
      '',
      'DANE ZDARZENIA:',
      `Data padniecia: ${date}`,
      `Przyczyna: ${deathCauseNames[formData.deathCause] || formData.deathCause}`,
      `Miejsce: ${formData.deathPlace === 'GOSPODARSTWO' ? 'Gospodarstwo' : formData.deathPlace}`,
      `Sposob utylizacji: ${disposalNames[formData.disposalMethod] || formData.disposalMethod}`,
      '',
      `Data sporzadzenia: ${createdDate}`,
      '',
      'Podpis: _______________________',
    ]);
  }

  private buildBirthReportContent(data: ReportData): string {
    const { formData, farm } = data;

    const birthDate = new Date(formData.birthDate).toLocaleDateString('pl-PL');
    const createdDate = new Date(data.createdAt).toLocaleDateString('pl-PL');

    return this.buildPdf('ZGLOSZENIE URODZENIA ZWIERZECIA', [
      'Formularz ZZU - Zgloszenie urodzenia zwierzecia',
      '',
      'DANE GOSPODARSTWA:',
      `Nr producenta: ${formData.producerNumber}`,
      `Nr siedziby stada: ${formData.herdNumber}`,
      `Nazwa: ${farm?.name || '-'}`,
      '',
      'DANE NOWORODKA:',
      `Nr kolczyka: ${formData.earTagNumber}`,
      `Gatunek: ${SPECIES_NAMES[formData.species] || formData.species}`,
      `Plec: ${GENDER_NAMES[formData.gender] || formData.gender}`,
      `Data urodzenia: ${birthDate}`,
      `Rasa: ${formData.breed || '-'}`,
      '',
      'DANE MATKI:',
      `Nr kolczyka matki: ${formData.motherEarTag || 'nieznany'}`,
      '',
      `Data sporzadzenia: ${createdDate}`,
      '',
      'Podpis: _______________________',
    ]);
  }

  private buildTransferReportContent(data: ReportData): string {
    const { formData, farm } = data;

    const directionNames: Record<string, string> = {
      IN: 'Przyjecie do gospodarstwa',
      OUT: 'Wydanie z gospodarstwa',
    };

    const transferDate = new Date(formData.transferDate).toLocaleDateString('pl-PL');
    const createdDate = new Date(data.createdAt).toLocaleDateString('pl-PL');

    const directionLabel = directionNames[formData.direction] || formData.direction;
    const otherFarmLabel = formData.direction === 'OUT' ? 'GOSPODARSTWO DOCELOWE' : 'GOSPODARSTWO ZRODLOWE';

    return this.buildPdf('ZGLOSZENIE PRZEMIESZCZENIA ZWIERZECIA', [
      'Formularz ZPZ - Zgloszenie przemieszczenia zwierzecia',
      '',
      'DANE GOSPODARSTWA ZGLASZAJACEGO:',
      `Nr producenta: ${formData.producerNumber}`,
      `Nr siedziby stada: ${formData.herdNumber}`,
      `Nazwa: ${farm?.name || '-'}`,
      '',
      'DANE ZWIERZECIA:',
      `Nr kolczyka: ${formData.earTagNumber}`,
      `Gatunek: ${SPECIES_NAMES[formData.species] || formData.species}`,
      `Rasa: ${formData.breed || '-'}`,
      '',
      'DANE PRZEMIESZCZENIA:',
      `Typ: ${directionLabel}`,
      `Data przemieszczenia: ${transferDate}`,
      `Powod: ${formData.reason || '-'}`,
      `Nr dokumentu przewozowego: ${formData.transportDocNumber || '-'}`,
      '',
      `${otherFarmLabel}:`,
      `Nr producenta: ${formData.otherProducerNumber}`,
      `Nr siedziby stada: ${formData.otherHerdNumber}`,
      `Nazwa: ${formData.otherFarmName || '-'}`,
      '',
      `Data sporzadzenia: ${createdDate}`,
      '',
      'Podpis: _______________________',
    ]);
  }

  private buildPdf(title: string, lines: string[]): string {
    const contentLines = lines.map((line, i) => {
      const yOffset = i === 0 ? -30 : -15;
      if (line === '') return `0 -10 Td () Tj`;
      return `0 ${yOffset} Td (${this.escapePdfString(line)}) Tj`;
    }).join('\n');

    return `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 2000 >>
stream
BT
/F1 16 Tf
50 750 Td
(${this.escapePdfString(title)}) Tj
/F1 12 Tf
${contentLines}
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000266 00000 n
0000002320 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
2397
%%EOF`;
  }

  private escapePdfString(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (char) => {
        const map: Record<string, string> = {
          'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n',
          'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
          'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N',
          'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z',
        };
        return map[char] || char;
      });
  }
}
