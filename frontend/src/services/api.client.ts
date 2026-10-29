import { ApiResponse } from '../types/api.types';

export class ApiError extends Error {
  public statusCode: number;
  public errorCode?: string;
  public details?: unknown;

  constructor(message: string, statusCode: number, errorCode?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

export const ACCESS_TOKEN_KEY = 'cp_access_token';
export const REFRESH_TOKEN_KEY = 'cp_refresh_token';
export const LEGACY_TOKEN_KEY = 'cp_auth_token';

class ApiClient {
  private baseUrl: string;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  }

  public getAccessToken(): string | null {
    return (
      localStorage.getItem(ACCESS_TOKEN_KEY) ||
      localStorage.getItem(LEGACY_TOKEN_KEY) ||
      null
    );
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  public setTokens(accessToken: string, refreshToken?: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(LEGACY_TOKEN_KEY, accessToken); // Backward compatibility
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  public clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  private onRefreshed(token: string): void {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(callback: (token: string) => void): void {
    this.refreshSubscribers.push(callback);
  }

  private async tryRefreshToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const url = `${this.baseUrl}/auth/refresh-token`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return null;
      }

      const json = await response.json();
      const newTokens = json.data?.tokens;
      if (newTokens?.accessToken) {
        this.setTokens(newTokens.accessToken, newTokens.refreshToken);
        return newTokens.accessToken;
      }
      return null;
    } catch {
      this.clearTokens();
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false
  ): Promise<T> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const token = this.getAccessToken();
    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized with token refresh if possible
      if (
        response.status === 401 &&
        !isRetry &&
        !endpoint.includes('/auth/login') &&
        !endpoint.includes('/auth/register') &&
        !endpoint.includes('/auth/refresh-token')
      ) {
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          const newToken = await this.tryRefreshToken();
          this.isRefreshing = false;

          if (newToken) {
            this.onRefreshed(newToken);
            return this.request<T>(endpoint, options, true);
          }
        } else {
          // Wait for token refresh in-flight
          return new Promise<T>((resolve, reject) => {
            this.addRefreshSubscriber(async () => {
              try {
                const retryRes = await this.request<T>(endpoint, options, true);
                resolve(retryRes);
              } catch (err) {
                reject(err);
              }
            });
          });
        }
      }

      const data = (await response.json()) as ApiResponse<T>;

      if (!response.ok || !data.success) {
        throw new ApiError(
          data.message || `Request failed with status ${response.status}`,
          response.status,
          data.error?.code,
          data.error?.details
        );
      }

      return data.data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        (error as Error).message || 'Network request failed. Is the backend server running?',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  public get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  public upload<T>(endpoint: string, formData: FormData, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
    });
  }

  public async downloadBlob(endpoint: string): Promise<Blob> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const token = this.getAccessToken();
    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const response = await fetch(url, { headers });
    if (!response.ok) {
      let errorMsg = `Download failed with status ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson.message) errorMsg = errorJson.message;
      } catch {
        // use default
      }
      throw new ApiError(errorMsg, response.status);
    }
    return response.blob();
  }
}

export const apiClient = new ApiClient();
