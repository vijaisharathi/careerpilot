import { Schema, model, Document, Types } from 'mongoose';
import { SupportedLanguage } from './codingQuestion.model';

export type AssessmentType = 'practice' | 'timed' | 'role_based';

export interface IAssessmentQuestionRef {
  questionId: Types.ObjectId;
  marks: number;
  order: number;
}

export interface ICodingAssessmentData {
  title: string;
  slug: string;
  description: string;
  type: AssessmentType;
  targetRole?: string;
  categories: string[];
  questions: IAssessmentQuestionRef[];
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  supportedLanguages: SupportedLanguage[];
  maxAttempts: number;
  startTime?: Date;
  endTime?: Date;
  status: 'draft' | 'published' | 'archived';
  institutionId?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICodingAssessment extends Document, ICodingAssessmentData {
  _id: Types.ObjectId;
}

const assessmentQuestionRefSchema = new Schema<IAssessmentQuestionRef>(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'CodingQuestion',
      required: true,
    },
    marks: {
      type: Number,
      required: true,
      default: 10,
    },
    order: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  { _id: false }
);

const codingAssessmentSchema = new Schema<ICodingAssessment>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['practice', 'timed', 'role_based'],
      default: 'practice',
      index: true,
    },
    targetRole: {
      type: String,
      trim: true,
      index: true,
    },
    categories: {
      type: [String],
      default: [],
    },
    questions: {
      type: [assessmentQuestionRefSchema],
      default: [],
    },
    durationMinutes: {
      type: Number,
      default: 60, // 0 indicates untimed practice
    },
    totalMarks: {
      type: Number,
      required: true,
      default: 100,
    },
    passingMarks: {
      type: Number,
      required: true,
      default: 60,
    },
    supportedLanguages: {
      type: [String],
      enum: ['python', 'javascript', 'java', 'cpp'],
      default: ['python', 'javascript', 'java', 'cpp'],
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true,
    },
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

codingAssessmentSchema.index({ status: 1, type: 1 });

export const CodingAssessment = model<ICodingAssessment>(
  'CodingAssessment',
  codingAssessmentSchema
);

