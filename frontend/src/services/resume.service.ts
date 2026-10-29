import { apiClient } from './api.client';
import {
  IResumeDocument,
  IResumeAnalysis,
  ResumeTemplateId,
} from '../types/resume.types';

export class ResumeService {
  /**
   * Retrieves all resumes for the logged-in student.
   */
  public async getResumes(): Promise<IResumeDocument[]> {
    return apiClient.get<IResumeDocument[]>('/resumes');
  }

  /**
   * Retrieves a specific resume by ID.
   */
  public async getResumeById(id: string): Promise<IResumeDocument> {
    return apiClient.get<IResumeDocument>(`/resumes/${id}`);
  }

  /**
   * Creates a new blank resume.
   */
  public async createResume(data: Partial<IResumeDocument>): Promise<IResumeDocument> {
    return apiClient.post<IResumeDocument>('/resumes', data);
  }

  /**
   * Populates and saves a resume directly from the student's profile.
   */
  public async populateFromProfile(
    templateId: ResumeTemplateId = 'modern-clean',
    targetRole?: string
  ): Promise<IResumeDocument> {
    return apiClient.post<IResumeDocument>('/resumes/import-profile', {
      templateId,
      targetRole,
    });
  }

  /**
   * Updates an existing resume.
   */
  public async updateResume(
    id: string,
    data: Partial<IResumeDocument>
  ): Promise<IResumeDocument> {
    return apiClient.put<IResumeDocument>(`/resumes/${id}`, data);
  }

  /**
   * Creates a version snapshot.
   */
  public async createVersion(id: string): Promise<IResumeDocument> {
    return apiClient.post<IResumeDocument>(`/resumes/${id}/versions`);
  }

  /**
   * Creates a job-specific variant.
   */
  public async createVariant(
    id: string,
    targetRole: string,
    jobId?: string
  ): Promise<IResumeDocument> {
    return apiClient.post<IResumeDocument>(`/resumes/${id}/variants`, {
      targetRole,
      jobId,
    });
  }

  /**
   * Deletes a resume document.
   */
  public async deleteResume(id: string): Promise<void> {
    return apiClient.delete<void>(`/resumes/${id}`);
  }

  /**
   * Generates and triggers browser download of the PDF resume.
   */
  public async exportPdf(id: string, defaultFileName: string = 'Resume.pdf'): Promise<void> {
    const blob = await apiClient.downloadBlob(`/resumes/${id}/export/pdf`);
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = defaultFileName.endsWith('.pdf') ? defaultFileName : `${defaultFileName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  }

  /**
   * Performs criteria-based ATS analysis on an uploaded file or existing resume document.
   */
  public async analyzeResume(options: {
    file?: File;
    resumeId?: string;
    targetJobTitle?: string;
    targetJobDescription: string;
    jobId?: string;
  }): Promise<IResumeAnalysis> {
    if (options.file) {
      const formData = new FormData();
      formData.append('file', options.file);
      formData.append('targetJobDescription', options.targetJobDescription);
      if (options.targetJobTitle) formData.append('targetJobTitle', options.targetJobTitle);
      if (options.jobId) formData.append('jobId', options.jobId);

      return apiClient.upload<IResumeAnalysis>('/resumes/analyze', formData);
    }

    return apiClient.post<IResumeAnalysis>('/resumes/analyze', {
      resumeId: options.resumeId,
      targetJobTitle: options.targetJobTitle,
      targetJobDescription: options.targetJobDescription,
      jobId: options.jobId,
    });
  }

  /**
   * Retrieves previous analysis reports.
   */
  public async getAnalysisHistory(): Promise<IResumeAnalysis[]> {
    return apiClient.get<IResumeAnalysis[]>('/resumes/analyses');
  }

  /**
   * Retrieves a specific analysis report by ID.
   */
  public async getAnalysisById(id: string): Promise<IResumeAnalysis> {
    return apiClient.get<IResumeAnalysis>(`/resumes/analyses/${id}`);
  }

  /**
   * Applies an AI/criteria-suggested bullet improvement to a resume document.
   */
  public async applyBulletImprovement(
    resumeId: string,
    original: string,
    suggested: string
  ): Promise<IResumeDocument> {
    return apiClient.post<IResumeDocument>(`/resumes/${resumeId}/apply-bullet`, {
      original,
      suggested,
    });
  }
}

export const resumeService = new ResumeService();

