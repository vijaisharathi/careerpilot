import { Schema, model, Document, Types } from 'mongoose';
import { CatalogSkillRequirement } from '../config/careerCatalog.data';

export interface ICareerRole extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  category: string;
  description: string;
  averageSalary: {
    entry: string;
    mid: string;
    currency: string;
  };
  marketDemand: 'Extremely High' | 'High' | 'Moderate';
  growthOutlook: string;
  requiredSkills: CatalogSkillRequirement[];
  eligibilityCriteria: {
    minDegreeLevel: string;
    relevantFields: string[];
  };
  recommendedCertifications: Array<{
    title: string;
    issuer: string;
    importance: 'high' | 'medium';
  }>;
  recommendedProjects: Array<{
    title: string;
    description: string;
    technologies: string[];
  }>;
  isStandard: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const skillRequirementSchema = new Schema<CatalogSkillRequirement>(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['languages', 'frameworks', 'databases', 'cloud', 'soft_skills'],
      required: true,
    },
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

const careerRoleSchema = new Schema<ICareerRole>(
  {
    title: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, trim: true, unique: true, lowercase: true, index: true },
    category: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true, trim: true },
    averageSalary: {
      entry: { type: String, default: '$100,000 - $125,000' },
      mid: { type: String, default: '$140,000 - $180,000' },
      currency: { type: String, default: 'USD' },
    },
    marketDemand: {
      type: String,
      enum: ['Extremely High', 'High', 'Moderate'],
      default: 'High',
    },
    growthOutlook: { type: String, default: '+20% YoY' },
    requiredSkills: { type: [skillRequirementSchema], default: [] },
    eligibilityCriteria: {
      minDegreeLevel: { type: String, default: "Bachelor's" },
      relevantFields: { type: [String], default: [] },
    },
    recommendedCertifications: [
      {
        title: { type: String, required: true },
        issuer: { type: String, required: true },
        importance: { type: String, enum: ['high', 'medium'], default: 'high' },
        _id: false,
      },
    ],
    recommendedProjects: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        technologies: { type: [String], default: [] },
        _id: false,
      },
    ],
    isStandard: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const CareerRole = model<ICareerRole>('CareerRole', careerRoleSchema);

