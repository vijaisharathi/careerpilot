import { apiClient } from './api.client';
import { HealthCheckData } from '../types/api.types';

export const healthService = {
  getHealth: async (): Promise<HealthCheckData> => {
    return apiClient.get<HealthCheckData>('/health');
  },
};
