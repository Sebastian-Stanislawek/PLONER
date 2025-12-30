import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  token_type: string;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

@Injectable()
export class IrzAuthService {
  private readonly logger = new Logger(IrzAuthService.name);
  private readonly ssoUrl: string;
  private readonly clientId: string;
  private tokenCache = new Map<string, CachedToken>();

  constructor(private readonly config: ConfigService) {
    this.ssoUrl = this.config.get('IRZ_SSO_URL') || 
      'https://sso.arimr.gov.pl/auth/realms/ewniosekplus/protocol/openid-connect/token';
    this.clientId = this.config.get('IRZ_CLIENT_ID') || 'aplikacja-irzplus';
  }

  async getToken(username: string, password: string): Promise<string> {
    const cacheKey = username;
    const cached = this.tokenCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now() + 60000) {
      return cached.accessToken;
    }

    return this.fetchNewToken(username, password);
  }

  private async fetchNewToken(username: string, password: string): Promise<string> {
    const params = new URLSearchParams({
      username,
      password,
      client_id: this.clientId,
      grant_type: 'password',
    });

    try {
      const response = await axios.post<TokenResponse>(this.ssoUrl, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 30000,
      });

      const { access_token, expires_in } = response.data;

      this.tokenCache.set(username, {
        accessToken: access_token,
        expiresAt: Date.now() + expires_in * 1000,
      });

      this.logger.log(`Token IRZ+ uzyskany dla: ${username}`);
      return access_token;
    } catch (error) {
      const axiosError = error as AxiosError<{ error_description?: string }>;
      const message = axiosError.response?.data?.error_description || 'Błąd autentykacji IRZ+';
      this.logger.error(`Błąd autentykacji IRZ+: ${message}`);
      throw new Error(message);
    }
  }

  clearToken(username: string) {
    this.tokenCache.delete(username);
  }
}


