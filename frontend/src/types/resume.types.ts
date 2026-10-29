export type ResumeTemplateId =
  | 'modern-clean'
  | 'technical-classic'
  | 'minimalist-executive'
  | 'academic-research';

export interface IResumePersonalInfo {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  headline?: string;
  summary?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface IResumeEducation {
  _id?: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  honors?: string;
}

export interface IResumeExperience {
  _id?: string;
  role: string;
  company: string;
  location?: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface IResumeProject {
  _id?: string;
  title: string;
  technologies: string[];
  link?: string;
  bullets: string[];
}

export interface IResumeSkill {
  _id?: string;
  name: string;
  category: 'languages' | 'frameworks' | 'databases' | 'cloud' | 'soft_skills' | 'tools';
  proficiency?: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface IResumeCertification {
  _id?: string;
  title: string;
  issuer: string;
  issueDate: string;
  credentialUrl?: string;
}

export interface IResumeDocument {
  _id: string;
  user: string;
  title: string;
  targetRole?: string;
  jobId?: string;
  templateId: ResumeTemplateId;
  sectionOrder: string[];
  personalInfo: IResumePersonalInfo;
  education: IResumeEducation[];
  experience: IResumeExperience[];
  projects: IResumeProject[];
  skills: IResumeSkill[];
  certifications: IResumeCertification[];
  version: number;
  isCurrentDraft: boolean;
  parentResumeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IResumeAnalysisScores {
  overallScore: number;
  keywordMatchScore: number;
  formattingScore: number;
  sectionCompletenessScore: number;
  impactScore: number;
}

export interface ISectionFeedback {
  section: string;
  status: 'pass' | 'warn' | 'fail';
  feedback: string;
}

export interface IBulletImprovement {
  original: string;
  suggested: string;
  rationale: string;
  applied?: boolean;
}

export interface IResumeAnalysis {
  _id: string;
  user: string;
  resumeDocumentId?: string;
  originalFileName?: string;
  fileSize?: number;
  mimeType?: string;
  targetJobTitle: string;
  targetJobDescription: string;
  jobId?: string;
  extractedTextLength: number;
  extractedTextPreview: string;
  scores: IResumeAnalysisScores;
  matchedKeywords: string[];
  missingKeywords: string[];
  sectionFeedback: ISectionFeedback[];
  bulletImprovements: IBulletImprovement[];
  actionableRecommendations: string[];
  atsDisclaimer: string;
  createdAt: string;
  updatedAt: string;
}

