import { httpClient } from './client';

export interface Document {
  id: string;
  farmId: string;
  animalId: string | null;
  type: string;
  status: string;
  irzDocNumber: string | null;
  formData: Record<string, unknown>;
  submittedAt: string | null;
  createdAt: string;
  animal?: { earTagNumber: string; species: string };
}

export interface CreateDeathReportRequest {
  animalId: string;
  deathDate: string;
  deathCause: 'NATURAL' | 'DISEASE' | 'ACCIDENT' | 'EUTHANASIA' | 'UNKNOWN';
  deathPlace?: string;
  disposalMethod: 'RENDERING_PLANT' | 'BURIAL' | 'VETERINARY';
}

export type Species = 'CATTLE' | 'SHEEP' | 'GOAT' | 'PIG' | 'HORSE' | 'POULTRY' | 'DEER' | 'CAMEL';
export type Gender = 'MALE' | 'FEMALE';

export interface CreateBirthReportRequest {
  farmId: string;
  earTagNumber: string;
  species: Species;
  gender: Gender;
  birthDate: string;
  breed?: string;
  motherId?: string;
  motherEarTag?: string;
}

export type TransferDirection = 'IN' | 'OUT';

export interface CreateTransferReportRequest {
  animalId: string;
  direction: TransferDirection;
  transferDate: string;
  otherProducerNumber: string;
  otherHerdNumber: string;
  otherFarmName?: string;
  reason?: string;
  transportDocNumber?: string;
}

export const documentsHttp = {
  getByFarm: (farmId: string) => httpClient.get<Document[]>(`/documents/farm/${farmId}`),

  getById: (id: string) => httpClient.get<Document>(`/documents/${id}`),

  createDeathReport: (data: CreateDeathReportRequest) =>
    httpClient.post<Document>('/documents/death-report', data),

  createBirthReport: (data: CreateBirthReportRequest) =>
    httpClient.post<Document>('/documents/birth-report', data),

  createTransferReport: (data: CreateTransferReportRequest) =>
    httpClient.post<Document>('/documents/transfer-report', data),

  submit: (id: string) =>
    httpClient.post<{ success: boolean; documentNumber?: string }>(`/documents/${id}/submit`),

  downloadPdf: async (id: string) => {
    const response = await httpClient.getBlob(`/documents/${id}/pdf`);
    const blob = new Blob([response], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Cleanup po chwili
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  },
};

