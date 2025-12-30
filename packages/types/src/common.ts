// Wspólne typy używane w całej aplikacji

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
}

export type Species = 'CATTLE' | 'SHEEP' | 'GOAT' | 'PIG' | 'POULTRY' | 'HORSE' | 'DEER' | 'CAMEL';
export type Gender = 'MALE' | 'FEMALE';
export type AnimalStatus = 'ACTIVE' | 'DECEASED' | 'SOLD' | 'SLAUGHTERED';
export type DocumentType = 'BIRTH_REPORT' | 'DEATH_REPORT' | 'TRANSFER_REPORT' | 'SLAUGHTER_REPORT' | 'DISPOSAL_REPORT';
export type DocumentStatus = 'DRAFT' | 'PENDING' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'ERROR';
export type SyncStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';


