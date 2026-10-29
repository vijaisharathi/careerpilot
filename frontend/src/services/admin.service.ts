import { apiClient } from './api.client';
import {
  AdminOverviewMetrics,
  AdminStudentSummary,
  AdminStudentDetail,
  AdminPagination,
  AdminJobItem,
  AdminCareerRoleItem,
  AdminLearningResourceItem,
  AdminAiMonitoringStats,
  AdminAuditLogItem,
  AdminPlatformSettings,
} from '../types/admin.types';

export const adminService = {
  // 1. Overview
  getOverview: async (): Promise<AdminOverviewMetrics> => {
    return apiClient.get<AdminOverviewMetrics>('/admin/overview');
  },

  // 2. Students
  getStudents: async (query?: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    graduationYear?: number;
    status?: string;
  }): Promise<{ students: AdminStudentSummary[]; pagination: AdminPagination }> => {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));
    if (query?.search) params.append('search', query.search);
    if (query?.department && query.department !== 'all') params.append('department', query.department);
    if (query?.graduationYear) params.append('graduationYear', String(query.graduationYear));
    if (query?.status && query.status !== 'all') params.append('status', query.status);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<{ students: AdminStudentSummary[]; pagination: AdminPagination }>(
      `/admin/students${queryString}`
    );
  },

  getStudentDetail: async (id: string): Promise<AdminStudentDetail> => {
    return apiClient.get<AdminStudentDetail>(`/admin/students/${id}`);
  },

  updateStudentStatus: async (
    id: string,
    status: 'active' | 'suspended',
    reason?: string
  ): Promise<{ id: string; status: 'active' | 'suspended' }> => {
    return apiClient.patch<{ id: string; status: 'active' | 'suspended' }>(
      `/admin/students/${id}/status`,
      { status, reason }
    );
  },

  provisionAdmin: async (data: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ id: string; name: string; email: string; role: string }> => {
    return apiClient.post<{ id: string; name: string; email: string; role: string }>(
      '/admin/users/provision-admin',
      data
    );
  },

  // 3. Jobs
  getJobs: async (query?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    employmentType?: string;
    workMode?: string;
  }): Promise<{ jobs: AdminJobItem[]; pagination: AdminPagination }> => {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));
    if (query?.search) params.append('search', query.search);
    if (query?.status && query.status !== 'all') params.append('status', query.status);
    if (query?.employmentType && query.employmentType !== 'all')
      params.append('employmentType', query.employmentType);
    if (query?.workMode && query.workMode !== 'all') params.append('workMode', query.workMode);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<{ jobs: AdminJobItem[]; pagination: AdminPagination }>(
      `/admin/jobs${queryString}`
    );
  },

  createJob: async (payload: Partial<AdminJobItem>): Promise<AdminJobItem> => {
    return apiClient.post<AdminJobItem>('/admin/jobs', payload);
  },

  getJobDetail: async (id: string): Promise<AdminJobItem> => {
    return apiClient.get<AdminJobItem>(`/admin/jobs/${id}`);
  },

  updateJob: async (id: string, payload: Partial<AdminJobItem>): Promise<AdminJobItem> => {
    return apiClient.put<AdminJobItem>(`/admin/jobs/${id}`, payload);
  },

  updateJobStatus: async (
    id: string,
    status: 'draft' | 'published' | 'active' | 'expired' | 'archived'
  ): Promise<AdminJobItem> => {
    return apiClient.patch<AdminJobItem>(`/admin/jobs/${id}/status`, { status });
  },

  deleteJob: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/admin/jobs/${id}`);
  },

  // 4. Career Roles
  getCareerRoles: async (): Promise<AdminCareerRoleItem[]> => {
    return apiClient.get<AdminCareerRoleItem[]>('/admin/career-roles');
  },

  createCareerRole: async (payload: Partial<AdminCareerRoleItem>): Promise<AdminCareerRoleItem> => {
    return apiClient.post<AdminCareerRoleItem>('/admin/career-roles', payload);
  },

  updateCareerRole: async (
    idOrSlug: string,
    payload: Partial<AdminCareerRoleItem>
  ): Promise<AdminCareerRoleItem> => {
    return apiClient.put<AdminCareerRoleItem>(`/admin/career-roles/${idOrSlug}`, payload);
  },

  toggleCareerRoleStatus: async (idOrSlug: string): Promise<AdminCareerRoleItem> => {
    return apiClient.patch<AdminCareerRoleItem>(`/admin/career-roles/${idOrSlug}/status`);
  },

  // 5. Learning Resources
  getLearningResources: async (query?: {
    page?: number;
    limit?: number;
    search?: string;
    topic?: string;
    relatedSkill?: string;
    publicationStatus?: string;
  }): Promise<{ resources: AdminLearningResourceItem[]; pagination: AdminPagination }> => {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));
    if (query?.search) params.append('search', query.search);
    if (query?.topic && query.topic !== 'all') params.append('topic', query.topic);
    if (query?.relatedSkill && query.relatedSkill !== 'all')
      params.append('relatedSkill', query.relatedSkill);
    if (query?.publicationStatus && query.publicationStatus !== 'all')
      params.append('publicationStatus', query.publicationStatus);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<{ resources: AdminLearningResourceItem[]; pagination: AdminPagination }>(
      `/admin/learning-resources${queryString}`
    );
  },

  createLearningResource: async (
    payload: Partial<AdminLearningResourceItem>
  ): Promise<AdminLearningResourceItem> => {
    return apiClient.post<AdminLearningResourceItem>('/admin/learning-resources', payload);
  },

  updateLearningResource: async (
    id: string,
    payload: Partial<AdminLearningResourceItem>
  ): Promise<AdminLearningResourceItem> => {
    return apiClient.put<AdminLearningResourceItem>(`/admin/learning-resources/${id}`, payload);
  },

  deleteLearningResource: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/admin/learning-resources/${id}`);
  },

  // 6. AI Monitoring
  getAiMonitoring: async (): Promise<AdminAiMonitoringStats> => {
    return apiClient.get<AdminAiMonitoringStats>('/admin/ai/status');
  },

  // 7. Audit Logs
  getAuditLogs: async (query?: {
    page?: number;
    limit?: number;
    search?: string;
    eventType?: string;
    status?: string;
  }): Promise<{ logs: AdminAuditLogItem[]; pagination: AdminPagination }> => {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));
    if (query?.search) params.append('search', query.search);
    if (query?.eventType && query.eventType !== 'all') params.append('eventType', query.eventType);
    if (query?.status && query.status !== 'all') params.append('status', query.status);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<{ logs: AdminAuditLogItem[]; pagination: AdminPagination }>(
      `/admin/audit-logs${queryString}`
    );
  },

  // 8. Platform Settings
  getSettings: async (): Promise<AdminPlatformSettings> => {
    return apiClient.get<AdminPlatformSettings>('/admin/settings');
  },

  updateSettings: async (payload: Partial<AdminPlatformSettings>): Promise<AdminPlatformSettings> => {
    return apiClient.put<AdminPlatformSettings>('/admin/settings', payload);
  },
};

