import { apiClient } from './api.client';
import { AiCareerAdviceResponse, AiServiceStatus } from '../types/api.types';

export const aiService = {
  getStatus: async (): Promise<AiServiceStatus> => {
    return apiClient.get<AiServiceStatus>('/ai/status');
  },

  getCareerAdvice: async (
    prompt: string,
    options?: { model?: string; temperature?: number; maxTokens?: number }
  ): Promise<AiCareerAdviceResponse> => {
    return apiClient.post<AiCareerAdviceResponse>('/ai/career-advice', {
      prompt,
      ...options,
    });
  },
};
