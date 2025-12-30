import { httpClient } from './client';
import type { LoginRequest, LoginResponse, RegisterRequest, RefreshTokenResponse } from '@ploner/types';

export const authHttp = {
  login: (data: LoginRequest) => httpClient.post<LoginResponse>('/auth/login', data),

  register: (data: RegisterRequest) => httpClient.post<LoginResponse>('/auth/register', data),

  refresh: (refreshToken: string) =>
    httpClient.post<RefreshTokenResponse>('/auth/refresh', { refreshToken }),
};


