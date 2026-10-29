import { Schema, model, Document, Types } from 'mongoose';

export type AttemptStatus = 'in_progress' | 'completed' | 'timed_out' | 'abandoned';

export interface IAttemptQuestionSubmission {
  questionId: Types.ObjectId;
  submissionId?: Types.ObjectId;
  marksAwarded: number;
}

export interface IAssessmentAttemptData {
  assessmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  attemptNumber: number;
  startedAt: Date;
  expiresAt: Date;
  submittedAt?: Date;
  status: AttemptStatus;
  questionSubmissions: IAttemptQuestionSubmission[];
  totalScore: number;
  passed: boolean;
  feedbackSummary?: string;
  timeTakenSeconds?: number;
  clientIp?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAssessmentAttempt extends Document, IAssessmentAttemptData {
  _id: Types.ObjectId;
}

const attemptQuestionSubmissionSchema = new Schema<IAttemptQuestionSubmission>(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'CodingQuestion',
      required: true,
    },
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: 'CodeSubmission',
    },
    marksAwarded: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const assessmentAttemptSchema = new Schema<IAssessmentAttempt>(
  {
    assessmentId: {
      type: Schema.Types.ObjectId,
      ref: 'CodingAssessment',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    submittedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'timed_out', 'abandoned'],
      default: 'in_progress',
      index: true,
    },
    questionSubmissions: {
      type: [attemptQuestionSubmissionSchema],
      default: [],
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    feedbackSummary: {
      type: String,
      trim: true,
    },
    timeTakenSeconds: {
      type: Number,
      default: 0,
    },
    clientIp: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

assessmentAttemptSchema.index(
  { assessmentId: 1, studentId: 1, attemptNumber: 1 },
  { unique: true }
);

export const AssessmentAttempt = model<IAssessmentAttempt>(
  'AssessmentAttempt',
  assessmentAttemptSchema
);

