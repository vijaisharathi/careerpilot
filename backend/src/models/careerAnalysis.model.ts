import { Schema, model, Document, Types } from 'mongoose';

export interface IMatchedSkill {
  name: string;
  category: string;
  studentLevel: string;
  requiredLevel: string;
  status: 'met' | 'exceeded' | 'partial';
  creditPercentage: number;
}

export interface IMissingSkill {
  name: string;
  category: string;
  requiredLevel: string;
  importance: 'critical' | 'recommended';
  estimatedHours: number;
  whyNeeded?: string;
}

export interface ITailoredProject {
  title: string;
  description: string;
  skillsCovered: string[];
  impact?: string;
}

export interface ITailoredCertification {
  title: string;
  issuer: string;
  priority: 'High' | 'Medium' | 'Low';
  reason?: string;
}

export interface IActionPlanStep {
  timeframe: string;
  objective: string;
  tasks: string[];
}

export interface ICareerAnalysisScores {
  readinessScore: number; // 0-100
  skillMatchScore: number; // 0-100
  projectScore: number; // 0-100
  experienceScore: number; // 0-100
  academicScore: number; // 0-100
  suitabilityLevel: 'High Match' | 'Moderate Match' | 'Developing Match';
}

export interface ICareerAnalysisExplanation {
  executiveSummary: string;
  strengthsNarrative: string;
  gapAnalysisNarrative: string;
  tailoredProjects: ITailoredProject[];
  tailoredCertifications: ITailoredCertification[];
  actionPlan: IActionPlanStep[];
  aiProvider: string;
  isAiSimulated: boolean;
}

export interface ICareerAnalysis extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  profileId: Types.ObjectId;
  targetRole: {
    roleId?: Types.ObjectId;
    title: string;
    slug: string;
    category: string;
  };
  profileSnapshot: {
    skillsCount: number;
    projectsCount: number;
    experienceCount: number;
    lastProfileUpdate: Date;
  };
  scores: ICareerAnalysisScores;
  matchedSkills: IMatchedSkill[];
  missingSkills: IMissingSkill[];
  strengths: string[];
  improvementAreas: string[];
  aiExplanation: ICareerAnalysisExplanation;
  isStale: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const matchedSkillSchema = new Schema<IMatchedSkill>(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    studentLevel: { type: String, required: true },
    requiredLevel: { type: String, required: true },
    status: { type: String, enum: ['met', 'exceeded', 'partial'], required: true },
    creditPercentage: { type: Number, required: true },
  },
  { _id: false }
);

const missingSkillSchema = new Schema<IMissingSkill>(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    requiredLevel: { type: String, required: true },
    importance: { type: String, enum: ['critical', 'recommended'], required: true },
    estimatedHours: { type: Number, required: true },
    whyNeeded: { type: String },
  },
  { _id: false }
);

const tailoredProjectSchema = new Schema<ITailoredProject>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    skillsCovered: { type: [String], default: [] },
    impact: { type: String },
  },
  { _id: false }
);

const tailoredCertificationSchema = new Schema<ITailoredCertification>(
  {
    title: { type: String, required: true },
    issuer: { type: String, required: true },
    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'High' },
    reason: { type: String },
  },
  { _id: false }
);

const actionPlanStepSchema = new Schema<IActionPlanStep>(
  {
    timeframe: { type: String, required: true },
    objective: { type: String, required: true },
    tasks: { type: [String], default: [] },
  },
  { _id: false }
);

const careerAnalysisSchema = new Schema<ICareerAnalysis>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    profileId: {
      type: Schema.Types.ObjectId,
      ref: 'StudentProfile',
      required: true,
    },
    targetRole: {
      roleId: { type: Schema.Types.ObjectId, ref: 'CareerRole' },
      title: { type: String, required: true },
      slug: { type: String, required: true, index: true },
      category: { type: String, required: true },
    },
    profileSnapshot: {
      skillsCount: { type: Number, default: 0 },
      projectsCount: { type: Number, default: 0 },
      experienceCount: { type: Number, default: 0 },
      lastProfileUpdate: { type: Date, default: Date.now },
    },
    scores: {
      readinessScore: { type: Number, required: true, min: 0, max: 100 },
      skillMatchScore: { type: Number, required: true, min: 0, max: 100 },
      projectScore: { type: Number, required: true, min: 0, max: 100 },
      experienceScore: { type: Number, required: true, min: 0, max: 100 },
      academicScore: { type: Number, required: true, min: 0, max: 100 },
      suitabilityLevel: {
        type: String,
        enum: ['High Match', 'Moderate Match', 'Developing Match'],
        required: true,
      },
    },
    matchedSkills: { type: [matchedSkillSchema], default: [] },
    missingSkills: { type: [missingSkillSchema], default: [] },
    strengths: { type: [String], default: [] },
    improvementAreas: { type: [String], default: [] },
    aiExplanation: {
      executiveSummary: { type: String, required: true },
      strengthsNarrative: { type: String, required: true },
      gapAnalysisNarrative: { type: String, required: true },
      tailoredProjects: { type: [tailoredProjectSchema], default: [] },
      tailoredCertifications: { type: [tailoredCertificationSchema], default: [] },
      actionPlan: { type: [actionPlanStepSchema], default: [] },
      aiProvider: { type: String, default: 'deterministic-fallback' },
      isAiSimulated: { type: Boolean, default: false },
    },
    isStale: { type: Boolean, default: false },
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

// Index to retrieve latest user analysis efficiently
careerAnalysisSchema.index({ user: 1, createdAt: -1 });

export const CareerAnalysis = model<ICareerAnalysis>('CareerAnalysis', careerAnalysisSchema);

