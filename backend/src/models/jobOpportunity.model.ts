import { Schema, model, Document, Types } from 'mongoose';

export type EmploymentType = 'Full-time' | 'Internship' | 'Co-op' | 'Contract';
export type WorkMode = 'Remote' | 'Hybrid' | 'On-site';
export type JobStatus = 'draft' | 'published' | 'active' | 'expired' | 'archived';
export type DataSourceType = 'seed_demonstration' | 'verified_api' | 'campus_partner';
export type ExperienceLevel = 'Entry-Level' | 'Internship' | 'Associate' | 'Mid-Level';

export interface IRequiredSkill {
  name: string;
  minProficiency: 'Beginner' | 'Intermediate' | 'Advanced';
  importance: 'critical' | 'recommended';
  weight: number; // 1 to 5
}

export interface IMinimumQualifications {
  minDegreeLevel?: string; // e.g. "Bachelor's"
  allowedMajors?: string[]; // e.g. ["Computer Science", "Information Technology", "Software Engineering"]
  minGpa?: number; // e.g. 3.0
  minGraduationYear?: number; // e.g. 2025
  maxGraduationYear?: number; // e.g. 2028
  additionalRequirements?: string[];
}

export interface IExperienceRequirements {
  minYears: number;
  level: ExperienceLevel;
}

export interface ICompensation {
  amount: string; // e.g. "$110,000 - $130,000" or "$45 - $55 / hr"
  currency: string; // "USD", "INR", etc.
  period: 'yearly' | 'monthly' | 'hourly';
}

export interface IJobOpportunityData {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  company: string;
  companyLogo: string;
  description: string;
  roleCategory: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
  location: string;
  compensation: ICompensation;
  experienceRequirements: IExperienceRequirements;
  requiredSkills: IRequiredSkill[];
  preferredSkills: string[];
  minimumQualifications: IMinimumQualifications;
  responsibilities: string[];
  applicationUrl: string;
  source: string;
  dataSourceType: DataSourceType;
  isVerifiedVacancy: boolean;
  demoDisclaimer?: string;
  publicationDate: Date;
  applicationDeadline?: Date | null;
  status: JobStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IJobOpportunity extends Document, IJobOpportunityData {
  _id: Types.ObjectId;
}


const requiredSkillSchema = new Schema<IRequiredSkill>(
  {
    name: { type: String, required: true, trim: true },
    minProficiency: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate',
    },
    importance: {
      type: String,
      enum: ['critical', 'recommended'],
      default: 'critical',
    },
    weight: { type: Number, default: 3, min: 1, max: 5 },
  },
  { _id: false }
);

const minimumQualificationsSchema = new Schema<IMinimumQualifications>(
  {
    minDegreeLevel: { type: String, trim: true },
    allowedMajors: { type: [String], default: [] },
    minGpa: { type: Number, min: 0, max: 4.0 },
    minGraduationYear: { type: Number },
    maxGraduationYear: { type: Number },
    additionalRequirements: { type: [String], default: [] },
  },
  { _id: false }
);

const compensationSchema = new Schema<ICompensation>(
  {
    amount: { type: String, required: true, trim: true },
    currency: { type: String, default: 'USD', trim: true },
    period: {
      type: String,
      enum: ['yearly', 'monthly', 'hourly'],
      default: 'yearly',
    },
  },
  { _id: false }
);

const experienceRequirementsSchema = new Schema<IExperienceRequirements>(
  {
    minYears: { type: Number, default: 0, min: 0 },
    level: {
      type: String,
      enum: ['Entry-Level', 'Internship', 'Associate', 'Mid-Level'],
      default: 'Entry-Level',
    },
  },
  { _id: false }
);

const jobOpportunitySchema = new Schema<IJobOpportunity>(
  {
    title: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    company: { type: String, required: true, trim: true, index: true },
    companyLogo: {
      type: String,
      default: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&w=150&q=80',
    },
    description: { type: String, required: true },
    roleCategory: { type: String, required: true, trim: true, index: true },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Internship', 'Co-op', 'Contract'],
      required: true,
      index: true,
    },
    workMode: {
      type: String,
      enum: ['Remote', 'Hybrid', 'On-site'],
      required: true,
      index: true,
    },
    location: { type: String, required: true, trim: true, index: true },
    compensation: { type: compensationSchema, required: true },
    experienceRequirements: { type: experienceRequirementsSchema, required: true },
    requiredSkills: { type: [requiredSkillSchema], default: [] },
    preferredSkills: { type: [String], default: [] },
    minimumQualifications: { type: minimumQualificationsSchema, default: {} },
    responsibilities: { type: [String], default: [] },
    applicationUrl: { type: String, required: true, trim: true },
    source: { type: String, required: true, default: 'Direct Career Portal' },
    dataSourceType: {
      type: String,
      enum: ['seed_demonstration', 'verified_api', 'campus_partner'],
      default: 'seed_demonstration',
      index: true,
    },
    isVerifiedVacancy: { type: Boolean, default: false, index: true },
    demoDisclaimer: {
      type: String,
      default:
        'Demo / Seed Listing — Simulated vacancy for college placement preparation & skill-gap auditing. Not an active verified third-party hire.',
    },
    publicationDate: { type: Date, default: Date.now, index: true },
    applicationDeadline: { type: Date, default: null },
    status: {
      type: String,
      enum: ['draft', 'published', 'active', 'expired', 'archived'],
      default: 'published',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for high-throughput searching, filtering, and sorting
jobOpportunitySchema.index({ status: 1, employmentType: 1, workMode: 1, publicationDate: -1 });
jobOpportunitySchema.index({ status: 1, roleCategory: 1, publicationDate: -1 });
jobOpportunitySchema.index({ 'requiredSkills.name': 1 });

// Full-text index for flexible keyword search
jobOpportunitySchema.index({
  title: 'text',
  company: 'text',
  description: 'text',
  'requiredSkills.name': 'text',
});

export const JobOpportunity = model<IJobOpportunity>('JobOpportunity', jobOpportunitySchema);
