import { apiClient } from './api.client';
import {
  PlacementDashboardData,
  PlacementStudentSummary,
  PlacementStudentDetail,
  PlacementDriveItem,
  DriveCandidateItem,
  PlacementAnalyticsData,
  PlacementAnnouncementItem,
  StudentCampusDriveItem,
} from '../types/placement.types';

export const placementService = {
  // 1. Dashboard Metrics
  getDashboardMetrics: async (): Promise<PlacementDashboardData> => {
    return apiClient.get<PlacementDashboardData>('/placement/dashboard/metrics');
  },

  // 2. Student Directory
  getStudents: async (query?: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    graduationYear?: number;
    readinessCategory?: string;
    placementStatus?: string;
  }): Promise<{
    students: PlacementStudentSummary[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> => {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));
    if (query?.search) params.append('search', query.search);
    if (query?.department && query.department !== 'all')
      params.append('department', query.department);
    if (query?.graduationYear)
      params.append('graduationYear', String(query.graduationYear));
    if (query?.readinessCategory && query.readinessCategory !== 'all')
      params.append('readinessCategory', query.readinessCategory);
    if (query?.placementStatus && query.placementStatus !== 'all')
      params.append('placementStatus', query.placementStatus);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<{
      students: PlacementStudentSummary[];
      pagination: any;
    }>(`/placement/students${queryString}`);
  },

  getStudentDetail: async (id: string): Promise<PlacementStudentDetail> => {
    return apiClient.get<PlacementStudentDetail>(`/placement/students/${id}`);
  },

  // 3. Recruitment Drives
  getDrives: async (query?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{
    drives: PlacementDriveItem[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> => {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));
    if (query?.status && query.status !== 'all') params.append('status', query.status);
    if (query?.search) params.append('search', query.search);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<{
      drives: PlacementDriveItem[];
      pagination: any;
    }>(`/placement/drives${queryString}`);
  },

  getDriveDetail: async (id: string): Promise<PlacementDriveItem & { stageBreakdown: Record<string, number>; totalRegistered: number }> => {
    return apiClient.get<any>(`/placement/drives/${id}`);
  },

  createDrive: async (payload: Partial<PlacementDriveItem>): Promise<PlacementDriveItem> => {
    return apiClient.post<PlacementDriveItem>('/placement/drives', payload);
  },

  updateDrive: async (
    id: string,
    payload: Partial<PlacementDriveItem>
  ): Promise<PlacementDriveItem> => {
    return apiClient.put<PlacementDriveItem>(`/placement/drives/${id}`, payload);
  },

  changeDriveStatus: async (id: string, status: string): Promise<PlacementDriveItem> => {
    return apiClient.patch<PlacementDriveItem>(`/placement/drives/${id}/status`, { status });
  },

  // 4. Candidate Registrations & Stage Progression
  getDriveCandidates: async (
    driveId: string,
    query?: { stage?: string; eligibility?: string }
  ): Promise<DriveCandidateItem[]> => {
    const params = new URLSearchParams();
    if (query?.stage && query.stage !== 'all') params.append('stage', query.stage);
    if (query?.eligibility && query.eligibility !== 'all')
      params.append('eligibility', query.eligibility);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<DriveCandidateItem[]>(
      `/placement/drives/${driveId}/candidates${queryString}`
    );
  },

  updateCandidateStage: async (
    driveId: string,
    registrationId: string,
    stage: string,
    comment?: string,
    offerDetails?: { salary?: string; designation?: string; offerLetterUrl?: string }
  ): Promise<any> => {
    return apiClient.patch(
      `/placement/drives/${driveId}/candidates/${registrationId}/stage`,
      { stage, comment, offerDetails }
    );
  },

  overrideCandidateEligibility: async (
    driveId: string,
    registrationId: string,
    status: string,
    reason: string
  ): Promise<any> => {
    return apiClient.post(
      `/placement/drives/${driveId}/candidates/${registrationId}/override-eligibility`,
      { status, reason }
    );
  },

  // 5. Analytics & Safe CSV Export
  getAnalytics: async (): Promise<PlacementAnalyticsData> => {
    return apiClient.get<PlacementAnalyticsData>('/placement/analytics');
  },

  exportCsv: async (
    type: 'students' | 'drives' | 'candidates',
    driveId?: string
  ): Promise<Blob> => {
    const params = new URLSearchParams();
    params.append('type', type);
    if (driveId) params.append('driveId', driveId);
    return apiClient.downloadBlob(`/placement/reports/export?${params.toString()}`);
  },

  // 6. Announcements
  getAnnouncements: async (): Promise<PlacementAnnouncementItem[]> => {
    return apiClient.get<PlacementAnnouncementItem[]>('/placement/announcements');
  },

  createAnnouncement: async (
    payload: Partial<PlacementAnnouncementItem>
  ): Promise<PlacementAnnouncementItem> => {
    return apiClient.post<PlacementAnnouncementItem>('/placement/announcements', payload);
  },

  // 7. Student Campus Placement Operations
  getStudentCampusDrives: async (): Promise<{
    institution: { id: string; name: string };
    drives: StudentCampusDriveItem[];
  }> => {
    return apiClient.get<any>('/placement/student/drives');
  },

  registerForCampusDrive: async (driveId: string): Promise<any> => {
    return apiClient.post(`/placement/student/drives/${driveId}/register`, {});
  },

  getStudentRegistrations: async (): Promise<any[]> => {
    return apiClient.get<any[]>('/placement/student/registrations');
  },

  getStudentAnnouncements: async (): Promise<any[]> => {
    return apiClient.get<any[]>('/placement/student/announcements');
  },
};
