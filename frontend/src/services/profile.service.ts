import { apiClient } from './api.client';
import {
  BackendStudentProfile,
  SkillEntry,
  ProjectEntry,
  CertificationEntry,
  EducationEntry,
  ExperienceEntry,
  CareerInterests,
} from '../types/user.types';

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
  location?: string;
  headline?: string;
  bio?: string;
  college?: string;
  degree?: string;
  department?: string;
  graduationYear?: number;
  careerInterests?: Partial<CareerInterests>;
}

export const profileService = {
  getProfile: async (): Promise<BackendStudentProfile> => {
    const data = await apiClient.get<{ profile: BackendStudentProfile }>('/profile/me');
    return data.profile;
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<BackendStudentProfile> => {
    const data = await apiClient.put<{ profile: BackendStudentProfile }>('/profile/me', payload);
    return data.profile;
  },

  // Skills
  addSkill: async (skill: SkillEntry): Promise<{ profile: BackendStudentProfile; skills: SkillEntry[] }> => {
    return apiClient.post<{ profile: BackendStudentProfile; skills: SkillEntry[] }>('/profile/skills', skill);
  },

  updateSkill: async (
    id: string,
    skill: Partial<SkillEntry>
  ): Promise<{ profile: BackendStudentProfile; skills: SkillEntry[] }> => {
    return apiClient.put<{ profile: BackendStudentProfile; skills: SkillEntry[] }>(`/profile/skills/${id}`, skill);
  },

  removeSkill: async (id: string): Promise<{ profile: BackendStudentProfile; skills: SkillEntry[] }> => {
    return apiClient.delete<{ profile: BackendStudentProfile; skills: SkillEntry[] }>(`/profile/skills/${id}`);
  },

  // Projects
  addProject: async (
    project: ProjectEntry
  ): Promise<{ profile: BackendStudentProfile; projects: ProjectEntry[] }> => {
    return apiClient.post<{ profile: BackendStudentProfile; projects: ProjectEntry[] }>('/profile/projects', project);
  },

  updateProject: async (
    id: string,
    project: Partial<ProjectEntry>
  ): Promise<{ profile: BackendStudentProfile; projects: ProjectEntry[] }> => {
    return apiClient.put<{ profile: BackendStudentProfile; projects: ProjectEntry[] }>(
      `/profile/projects/${id}`,
      project
    );
  },

  removeProject: async (id: string): Promise<{ profile: BackendStudentProfile; projects: ProjectEntry[] }> => {
    return apiClient.delete<{ profile: BackendStudentProfile; projects: ProjectEntry[] }>(`/profile/projects/${id}`);
  },

  // Certifications
  addCertification: async (
    cert: CertificationEntry
  ): Promise<{ profile: BackendStudentProfile; certifications: CertificationEntry[] }> => {
    return apiClient.post<{ profile: BackendStudentProfile; certifications: CertificationEntry[] }>(
      '/profile/certifications',
      cert
    );
  },

  updateCertification: async (
    id: string,
    cert: Partial<CertificationEntry>
  ): Promise<{ profile: BackendStudentProfile; certifications: CertificationEntry[] }> => {
    return apiClient.put<{ profile: BackendStudentProfile; certifications: CertificationEntry[] }>(
      `/profile/certifications/${id}`,
      cert
    );
  },

  removeCertification: async (
    id: string
  ): Promise<{ profile: BackendStudentProfile; certifications: CertificationEntry[] }> => {
    return apiClient.delete<{ profile: BackendStudentProfile; certifications: CertificationEntry[] }>(
      `/profile/certifications/${id}`
    );
  },

  // Education
  addEducation: async (
    edu: EducationEntry
  ): Promise<{ profile: BackendStudentProfile; educationHistory: EducationEntry[] }> => {
    return apiClient.post<{ profile: BackendStudentProfile; educationHistory: EducationEntry[] }>(
      '/profile/education',
      edu
    );
  },

  updateEducation: async (
    id: string,
    edu: Partial<EducationEntry>
  ): Promise<{ profile: BackendStudentProfile; educationHistory: EducationEntry[] }> => {
    return apiClient.put<{ profile: BackendStudentProfile; educationHistory: EducationEntry[] }>(
      `/profile/education/${id}`,
      edu
    );
  },

  removeEducation: async (
    id: string
  ): Promise<{ profile: BackendStudentProfile; educationHistory: EducationEntry[] }> => {
    return apiClient.delete<{ profile: BackendStudentProfile; educationHistory: EducationEntry[] }>(
      `/profile/education/${id}`
    );
  },

  // Experience
  addExperience: async (
    exp: ExperienceEntry
  ): Promise<{ profile: BackendStudentProfile; experience: ExperienceEntry[] }> => {
    return apiClient.post<{ profile: BackendStudentProfile; experience: ExperienceEntry[] }>(
      '/profile/experience',
      exp
    );
  },

  updateExperience: async (
    id: string,
    exp: Partial<ExperienceEntry>
  ): Promise<{ profile: BackendStudentProfile; experience: ExperienceEntry[] }> => {
    return apiClient.put<{ profile: BackendStudentProfile; experience: ExperienceEntry[] }>(
      `/profile/experience/${id}`,
      exp
    );
  },

  removeExperience: async (
    id: string
  ): Promise<{ profile: BackendStudentProfile; experience: ExperienceEntry[] }> => {
    return apiClient.delete<{ profile: BackendStudentProfile; experience: ExperienceEntry[] }>(
      `/profile/experience/${id}`
    );
  },
};

