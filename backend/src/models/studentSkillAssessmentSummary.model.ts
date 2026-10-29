import { Schema, model, Document, Types } from 'mongoose';

export interface ICategoryProficiency {
  category: string;
  problemsSolved: number;
  totalAttempted: number;
  accuracyPercentage: number;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface ILanguageProficiency {
  language: string;
  problemsSolved: number;
  lastUsed: Date;
}

export interface IStudentSkillAssessmentSummaryData {
  studentId: Types.ObjectId;
  overallCodingScore: number;
  totalProblemsSolved: number;
  totalSubmissions: number;
  categoryProficiencies: ICategoryProficiency[];
  languageProficiencies: ILanguageProficiency[];
  strengths: string[];
  areasForImprovement: string[];
  recommendedTopics: string[];
  lastEvaluatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStudentSkillAssessmentSummary
  extends Document,
    IStudentSkillAssessmentSummaryData {
  _id: Types.ObjectId;
}

const categoryProficiencySchema = new Schema<ICategoryProficiency>(
  {
    category: { type: String, required: true },
    problemsSolved: { type: Number, default: 0 },
    totalAttempted: { type: Number, default: 0 },
    accuracyPercentage: { type: Number, default: 0 },
    proficiencyLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
  },
  { _id: false }
);

const languageProficiencySchema = new Schema<ILanguageProficiency>(
  {
    language: { type: String, required: true },
    problemsSolved: { type: Number, default: 0 },
    lastUsed: { type: Date, default: Date.now },
  },
  { _id: false }
);

const studentSkillAssessmentSummarySchema =
  new Schema<IStudentSkillAssessmentSummary>(
    {
      studentId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
      },
      overallCodingScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      totalProblemsSolved: {
        type: Number,
        default: 0,
      },
      totalSubmissions: {
        type: Number,
        default: 0,
      },
      categoryProficiencies: {
        type: [categoryProficiencySchema],
        default: [],
      },
      languageProficiencies: {
        type: [languageProficiencySchema],
        default: [],
      },
      strengths: {
        type: [String],
        default: [],
      },
      areasForImprovement: {
        type: [String],
        default: [],
      },
      recommendedTopics: {
        type: [String],
        default: [],
      },
      lastEvaluatedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
    }
  );

export const StudentSkillAssessmentSummary =
  model<IStudentSkillAssessmentSummary>(
    'StudentSkillAssessmentSummary',
    studentSkillAssessmentSummarySchema
  );

