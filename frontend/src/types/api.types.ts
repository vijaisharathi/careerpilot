export interface ApiResponseMeta {
  timestamp: string;
  requestId?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  error?: {
    code?: string;
    details?: unknown;
  };
  meta: ApiResponseMeta;
}

export interface HealthCheckData {
  service: string;
  status: 'healthy' | 'degraded';
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
  database: {
    provider: string;
    status: 'connected' | 'connecting' | 'disconnected' | 'disconnecting' | 'uninitialized';
    connected: boolean;
  };
  aiService: {
    provider: string;
    configured: boolean;
    simulated: boolean;
  };
  system: {
    nodeVersion: string;
    memoryUsageMb: number;
  };
}

export interface AiServiceStatus {
  activeProvider: string;
  isConfigured: boolean;
  isSimulated: boolean;
  supportedProviders: string[];
}

export interface AiCareerAdviceResponse {
  text: string;
  provider: string;
  model: string;
  isSimulated: boolean;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}
