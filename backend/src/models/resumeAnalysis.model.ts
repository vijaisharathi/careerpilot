import { Schema, model, Document, Types } from 'mongoose';

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

export interface IResumeAnalysisData {
  user: Types.ObjectId;
  resumeDocumentId?: Types.ObjectId;
  originalFileName?: string;
  fileSize?: number;
  mimeType?: string;
  targetJobTitle: string;
  targetJobDescription: string;
  jobId?: Types.ObjectId;
  extractedTextLength: number;
  extractedTextPreview: string;
  scores: IResumeAnalysisScores;
  matchedKeywords: string[];
  missingKeywords: string[];
  sectionFeedback: ISectionFeedback[];
  bulletImprovements: IBulletImprovement[];
  actionableRecommendations: string[];
  atsDisclaimer: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IResumeAnalysis extends Document, IResumeAnalysisData {
  _id: Types.ObjectId;
}

const resumeAnalysisSchema = new Schema<IResumeAnalysis>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resumeDocumentId: { type: Schema.Types.ObjectId, ref: 'ResumeDocument', default: null },
    originalFileName: { type: String, trim: true },
    fileSize: { type: Number },
    mimeType: { type: String, trim: true },
    targetJobTitle: { type: String, required: true, trim: true, default: 'General Target Role' },
    targetJobDescription: { type: String, required: true, trim: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'JobOpportunity', default: null },
    extractedTextLength: { type: Number, default: 0 },
    extractedTextPreview: { type: String, default: '' },
    scores: {
      overallScore: { type: Number, required: true, min: 0, max: 100 },
      keywordMatchScore: { type: Number, required: true, min: 0, max: 100 },
      formattingScore: { type: Number, required: true, min: 0, max: 100 },
      sectionCompletenessScore: { type: Number, required: true, min: 0, max: 100 },
      impactScore: { type: Number, required: true, min: 0, max: 100 },
    },
    matchedKeywords: { type: [String], default: [] },
    missingKeywords: { type: [String], default: [] },
    sectionFeedback: [
      {
        section: { type: String, required: true },
        status: { type: String, enum: ['pass', 'warn', 'fail'], required: true },
        feedback: { type: String, required: true },
      },
    ],
    bulletImprovements: [
      {
        original: { type: String, required: true },
        suggested: { type: String, required: true },
        rationale: { type: String, required: true },
        applied: { type: Boolean, default: false },
      },
    ],
    actionableRecommendations: { type: [String], default: [] },
    atsDisclaimer: {
      type: String,
      default:
        'ATS compatibility scores represent structural and keyword alignment based on industry best practices. This analysis does not guarantee selection, interview invitation, or bypass third-party proprietary ATS filters.',
    },
  },
  { timestamps: true }
);

resumeAnalysisSchema.index({ user: 1, createdAt: -1 });

export const ResumeAnalysis = model<IResumeAnalysis>('ResumeAnalysis', resumeAnalysisSchema);

