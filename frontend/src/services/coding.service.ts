import { apiClient } from './api.client';
import {
  CodingQuestionSummary,
  CodingQuestionDetail,
  CodingAssessmentItem,
  AssessmentAttemptData,
  RunSampleResult,
  CodeSubmissionResult,
  StudentSkillSummaryData,
  SandboxStatusData,
  SupportedLanguage,
} from '../types/coding.types';

export const codingService = {
  // 1. Question Bank
  getQuestions: async (query?: {
    category?: string;
    difficulty?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    questions: CodingQuestionSummary[];
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
    if (query?.category && query.category !== 'all') params.append('category', query.category);
    if (query?.difficulty && query.difficulty !== 'all') params.append('difficulty', query.difficulty);
    if (query?.search) params.append('search', query.search);
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/coding/questions${queryString}`);
  },

  getQuestionDetail: async (idOrSlug: string): Promise<CodingQuestionDetail> => {
    return apiClient.get<CodingQuestionDetail>(`/coding/questions/${idOrSlug}`);
  },

  // 2. Assessments
  getAssessments: async (query?: {
    type?: string;
    category?: string;
    targetRole?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    assessments: CodingAssessmentItem[];
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
    if (query?.type && query.type !== 'all') params.append('type', query.type);
    if (query?.category && query.category !== 'all') params.append('category', query.category);
    if (query?.targetRole && query.targetRole !== 'all') params.append('targetRole', query.targetRole);
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/coding/assessments${queryString}`);
  },

  getAssessmentDetail: async (idOrSlug: string): Promise<CodingAssessmentItem> => {
    return apiClient.get<CodingAssessmentItem>(`/coding/assessments/${idOrSlug}`);
  },

  startAttempt: async (assessmentId: string): Promise<AssessmentAttemptData> => {
    return apiClient.post<AssessmentAttemptData>('/coding/attempts', { assessmentId });
  },

  getAttempt: async (attemptId: string): Promise<AssessmentAttemptData> => {
    return apiClient.get<AssessmentAttemptData>(`/coding/attempts/${attemptId}`);
  },

  finishAttempt: async (attemptId: string): Promise<AssessmentAttemptData> => {
    return apiClient.post<AssessmentAttemptData>(`/coding/attempts/${attemptId}/finish`, {});
  },

  // 3. Execution & Evaluation
  runSampleCode: async (payload: {
    questionId: string;
    language: SupportedLanguage;
    sourceCode: string;
  }): Promise<RunSampleResult> => {
    return apiClient.post<RunSampleResult>('/coding/run-sample', payload);
  },

  submitSolution: async (payload: {
    questionId: string;
    language: SupportedLanguage;
    sourceCode: string;
    assessmentId?: string;
    attemptId?: string;
  }): Promise<CodeSubmissionResult> => {
    return apiClient.post<CodeSubmissionResult>('/coding/submit', payload);
  },

  requestAiFeedback: async (submissionId: string): Promise<any> => {
    return apiClient.post(`/coding/submissions/${submissionId}/ai-feedback`, {});
  },

  // 4. Submissions & Skill Profile
  getSubmissions: async (query?: {
    questionId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ submissions: CodeSubmissionResult[]; totalCount: number }> => {
    const params = new URLSearchParams();
    if (query?.questionId) params.append('questionId', query.questionId);
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/coding/submissions${queryString}`);
  },

  getSubmissionDetail: async (submissionId: string): Promise<CodeSubmissionResult> => {
    return apiClient.get<CodeSubmissionResult>(`/coding/submissions/${submissionId}`);
  },

  getStudentSkillSummary: async (): Promise<StudentSkillSummaryData> => {
    return apiClient.get<StudentSkillSummaryData>('/coding/skill-profile');
  },

  getExecutionEngineStatus: async (): Promise<SandboxStatusData> => {
    return apiClient.get<SandboxStatusData>('/coding/engine/status');
  },

  // 5. Placement Officer Integration
  getPlacementCodingAnalytics: async (): Promise<any> => {
    return apiClient.get('/coding/placement/analytics');
  },

  getCandidateTechnicalSummary: async (studentId: string): Promise<any> => {
    return apiClient.get(`/coding/placement/candidates/${studentId}/summary`);
  },

  // 6. Admin Management
  createQuestion: async (payload: any): Promise<any> => {
    return apiClient.post('/coding/admin/questions', payload);
  },

  updateQuestion: async (id: string, payload: any): Promise<any> => {
    return apiClient.put(`/coding/admin/questions/${id}`, payload);
  },

  createAssessment: async (payload: any): Promise<any> => {
    return apiClient.post('/coding/admin/assessments', payload);
  },
};

