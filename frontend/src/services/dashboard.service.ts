import { apiClient } from './api.client';
import { DashboardMetricSummary } from '../types/dashboard.types';

export const dashboardService = {
  /**
   * Retrieves comprehensive metrics and personalized action items across all modules
   */
  getDashboardSummary: async (): Promise<DashboardMetricSummary> => {
    return apiClient.get<DashboardMetricSummary>('/dashboard/summary');
  },
};

