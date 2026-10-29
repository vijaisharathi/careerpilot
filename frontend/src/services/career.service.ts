import { apiClient } from './api.client';
import { CareerRole, CareerAnalysis } from '../types/career.types';

export const careerService = {
  getRoles: async (): Promise<CareerRole[]> => {
    const data = await apiClient.get<{ roles: CareerRole[] }>('/career/roles');
    return data.roles;
  },

  getRoleBySlug: async (slug: string): Promise<CareerRole> => {
    const data = await apiClient.get<{ role: CareerRole }>(`/career/roles/${slug}`);
    return data.role;
  },

  runAnalysis: async (roleSlug?: string): Promise<CareerAnalysis> => {
    const data = await apiClient.post<{ analysis: CareerAnalysis }>('/career/analyze', {
      roleSlug,
    });
    return data.analysis;
  },

  getLatestAnalysis: async (): Promise<CareerAnalysis | null> => {
    try {
      const data = await apiClient.get<{ analysis: CareerAnalysis | null }>('/career/analysis/latest');
      return data.analysis;
    } catch {
      return null;
    }
  },

  getAnalysisHistory: async (): Promise<CareerAnalysis[]> => {
    try {
      const data = await apiClient.get<{ history: CareerAnalysis[] }>('/career/analysis/history');
      return data.history || [];
    } catch {
      return [];
    }
  },

  getAnalysisById: async (id: string): Promise<CareerAnalysis> => {
    const data = await apiClient.get<{ analysis: CareerAnalysis }>(`/career/analysis/${id}`);
    return data.analysis;
  },
};

