import { apiClient } from './api.client';
import {
  IInterviewSession,
  CreateInterviewPayload,
  StudentSessionStats,
} from '../types/interview.types';

export class InterviewService {
  /**
   * Starts a new interactive interview session.
   */
  public async createSession(payload: CreateInterviewPayload): Promise<IInterviewSession> {
    return apiClient.post<IInterviewSession>('/interviews', payload);
  }

  /**
   * Retrieves active in-progress session for recovery.
   */
  public async getCurrentSession(): Promise<IInterviewSession | null> {
    try {
      const session = await apiClient.get<IInterviewSession | null>('/interviews/current');
      return session;
    } catch {
      return null;
    }
  }

  /**
   * Retrieves specific session by ID.
   */
  public async getSessionById(id: string): Promise<IInterviewSession> {
    return apiClient.get<IInterviewSession>(`/interviews/${id}`);
  }

  /**
   * Submits student text answer for real-time criteria evaluation.
   */
  public async submitAnswer(
    id: string,
    questionIndex: number,
    studentAnswer: string
  ): Promise<IInterviewSession> {
    return apiClient.post<IInterviewSession>(`/interviews/${id}/answers`, {
      questionIndex,
      studentAnswer,
    });
  }

  /**
   * Abandons an active session.
   */
  public async abandonSession(id: string): Promise<IInterviewSession> {
    return apiClient.post<IInterviewSession>(`/interviews/${id}/abandon`);
  }

  /**
   * Retrieves all previous interview sessions.
   */
  public async getStudentSessions(): Promise<IInterviewSession[]> {
    return apiClient.get<IInterviewSession[]>('/interviews');
  }

  /**
   * Retrieves aggregate progress statistics across all completed sessions.
   */
  public async getSessionStats(): Promise<StudentSessionStats> {
    return apiClient.get<StudentSessionStats>('/interviews/stats');
  }
}

export const interviewService = new InterviewService();

