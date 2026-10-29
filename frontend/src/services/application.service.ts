import { apiClient } from './api.client';
import {
  IJobApplication,
  CreateApplicationPayload,
  UpdateApplicationPayload,
  ApplicationStatsSummary,
  ApplicationQueryFilters,
} from '../types/application.types';

export const applicationService = {
  /**
   * Retrieves applications with optional filtering, search, and sorting.
   */
  getApplications: async (
    filters: ApplicationQueryFilters = {}
  ): Promise<IJobApplication[]> => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters.search && filters.search.trim()) {
      params.append('search', filters.search.trim());
    }
    if (filters.sortBy) {
      params.append('sortBy', filters.sortBy);
    }
    if (filters.sortOrder) {
      params.append('sortOrder', filters.sortOrder);
    }

    const queryStr = params.toString();
    const endpoint = `/applications${queryStr ? `?${queryStr}` : ''}`;
    return apiClient.get<IJobApplication[]>(endpoint);
  },

  /**
   * Retrieves a single application by ID with full details.
   */
  getApplicationById: async (id: string): Promise<IJobApplication> => {
    return apiClient.get<IJobApplication>(`/applications/${id}`);
  },

  /**
   * Creates or tracks a new application.
   */
  createApplication: async (
    payload: CreateApplicationPayload
  ): Promise<IJobApplication> => {
    return apiClient.post<IJobApplication>('/applications', payload);
  },

  /**
   * Updates an existing application and appends to status history if status changed.
   */
  updateApplication: async (
    id: string,
    payload: UpdateApplicationPayload
  ): Promise<IJobApplication> => {
    return apiClient.put<IJobApplication>(`/applications/${id}`, payload);
  },

  /**
   * Permanently deletes a tracked application.
   */
  deleteApplication: async (id: string): Promise<void> => {
    await apiClient.delete(`/applications/${id}`);
  },

  /**
   * Retrieves application pipeline statistics, response rates, and upcoming dates.
   */
  getApplicationStats: async (): Promise<ApplicationStatsSummary> => {
    return apiClient.get<ApplicationStatsSummary>('/applications/stats');
  },
};

