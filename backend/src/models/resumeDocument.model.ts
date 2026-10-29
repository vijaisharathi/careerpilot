import { Schema, model, Document, Types } from 'mongoose';

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
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  honors?: string;
}

export interface IResumeExperience {
  role: string;
  company: string;
  location?: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface IResumeProject {
  title: string;
  technologies: string[];
  link?: string;
  bullets: string[];
}

export interface IResumeSkill {
  name: string;
  category: 'languages' | 'frameworks' | 'databases' | 'cloud' | 'soft_skills' | 'tools';
  proficiency?: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface IResumeCertification {
  title: string;
  issuer: string;
  issueDate: string;
  credentialUrl?: string;
}

export interface IResumeDocumentData {
  user: Types.ObjectId;
  title: string;
  targetRole?: string;
  jobId?: Types.ObjectId;
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
  parentResumeId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IResumeDocument extends Document, IResumeDocumentData {
  _id: Types.ObjectId;
}

const resumeDocumentSchema = new Schema<IResumeDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, default: 'My Resume' },
    targetRole: { type: String, trim: true, default: '' },
    jobId: { type: Schema.Types.ObjectId, ref: 'JobOpportunity', default: null },
    templateId: {
      type: String,
      enum: ['modern-clean', 'technical-classic', 'minimalist-executive', 'academic-research'],
      default: 'modern-clean',
    },
    sectionOrder: {
      type: [String],
      default: ['personal', 'summary', 'skills', 'experience', 'projects', 'education', 'certifications'],
    },
    personalInfo: {
      fullName: { type: String, required: true, trim: true, default: '' },
      email: { type: String, required: true, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' },
      location: { type: String, trim: true, default: '' },
      headline: { type: String, trim: true, default: '' },
      summary: { type: String, trim: true, default: '' },
      linkedin: { type: String, trim: true, default: '' },
      github: { type: String, trim: true, default: '' },
      portfolio: { type: String, trim: true, default: '' },
    },
    education: [
      {
        institution: { type: String, required: true, trim: true },
        degree: { type: String, required: true, trim: true },
        field: { type: String, required: true, trim: true },
        startDate: { type: String, required: true, trim: true },
        endDate: { type: String, required: true, trim: true },
        gpa: { type: String, trim: true, default: '' },
        honors: { type: String, trim: true, default: '' },
      },
    ],
    experience: [
      {
        role: { type: String, required: true, trim: true },
        company: { type: String, required: true, trim: true },
        location: { type: String, trim: true, default: '' },
        startDate: { type: String, required: true, trim: true },
        endDate: { type: String, required: true, trim: true },
        current: { type: Boolean, default: false },
        bullets: { type: [String], default: [] },
      },
    ],
    projects: [
      {
        title: { type: String, required: true, trim: true },
        technologies: { type: [String], default: [] },
        link: { type: String, trim: true, default: '' },
        bullets: { type: [String], default: [] },
      },
    ],
    skills: [
      {
        name: { type: String, required: true, trim: true },
        category: {
          type: String,
          enum: ['languages', 'frameworks', 'databases', 'cloud', 'soft_skills', 'tools'],
          default: 'languages',
        },
        proficiency: {
          type: String,
          enum: ['Beginner', 'Intermediate', 'Advanced'],
          default: 'Intermediate',
        },
      },
    ],
    certifications: [
      {
        title: { type: String, required: true, trim: true },
        issuer: { type: String, required: true, trim: true },
        issueDate: { type: String, required: true, trim: true },
        credentialUrl: { type: String, trim: true, default: '' },
      },
    ],
    version: { type: Number, default: 1, min: 1 },
    isCurrentDraft: { type: Boolean, default: true },
    parentResumeId: { type: Schema.Types.ObjectId, ref: 'ResumeDocument', default: null },
  },
  { timestamps: true }
);

resumeDocumentSchema.index({ user: 1, isCurrentDraft: 1 });
resumeDocumentSchema.index({ user: 1, version: -1 });

export const ResumeDocument = model<IResumeDocument>('ResumeDocument', resumeDocumentSchema);

