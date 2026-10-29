import { apiClient } from './api.client';
import {
  BackendJobOpportunity,
  JobSearchQuery,
  JobSearchResponse,
  SavedJobItem,
  JobAiInsights,
} from '../types/job.types';

export const jobService = {
  searchJobs: async (query: JobSearchQuery = {}): Promise<JobSearchResponse> => {
    const queryParts: string[] = [];
    if (query.q) queryParts.push(`q=${encodeURIComponent(query.q)}`);
    if (query.employmentType && query.employmentType !== 'all') queryParts.push(`employmentType=${encodeURIComponent(query.employmentType)}`);
    if (query.workMode && query.workMode !== 'all') queryParts.push(`workMode=${encodeURIComponent(query.workMode)}`);
    if (query.roleCategory && query.roleCategory !== 'all') queryParts.push(`roleCategory=${encodeURIComponent(query.roleCategory)}`);
    if (query.skill && query.skill !== 'all') queryParts.push(`skill=${encodeURIComponent(query.skill)}`);
    if (query.location && query.location !== 'all') queryParts.push(`location=${encodeURIComponent(query.location)}`);
    if (query.minScore && query.minScore > 0) queryParts.push(`minScore=${encodeURIComponent(String(query.minScore))}`);
    if (query.verifiedOnly) queryParts.push('verifiedOnly=true');
    if (query.sortBy) queryParts.push(`sortBy=${encodeURIComponent(query.sortBy)}`);
    if (query.page) queryParts.push(`page=${encodeURIComponent(String(query.page))}`);
    if (query.limit) queryParts.push(`limit=${encodeURIComponent(String(query.limit))}`);

    const endpoint = `/jobs${queryParts.length > 0 ? `?${queryParts.join('&')}` : ''}`;
    const data = await apiClient.get<JobSearchResponse>(endpoint);
    return data;
  },

  getJobByIdOrSlug: async (idOrSlug: string): Promise<BackendJobOpportunity> => {
    const data = await apiClient.get<{ job: BackendJobOpportunity }>(`/jobs/${idOrSlug}`);
    return data.job;
  },

  getSavedJobs: async (): Promise<SavedJobItem[]> => {
    try {
      const data = await apiClient.get<{ savedJobs: SavedJobItem[] }>('/jobs/saved');
      return data.savedJobs || [];
    } catch {
      return [];
    }
  },

  saveJob: async (jobId: string, notes?: string): Promise<void> => {
    await apiClient.post(`/jobs/${jobId}/save`, { notes });
  },

  unsaveJob: async (jobId: string): Promise<void> => {
    await apiClient.delete(`/jobs/${jobId}/save`);
  },

  getAiInsights: async (jobId: string): Promise<JobAiInsights> => {
    const data = await apiClient.get<{ insights: JobAiInsights }>(`/jobs/${jobId}/ai-insights`);
    return data.insights;
  },
};
