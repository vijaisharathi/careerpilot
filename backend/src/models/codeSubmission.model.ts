import { Schema, model, Document, Types } from 'mongoose';
import { SupportedLanguage } from './codingQuestion.model';

export type SubmissionStatus =
  | 'accepted'
  | 'wrong_answer'
  | 'compilation_error'
  | 'runtime_error'
  | 'time_limit_exceeded'
  | 'memory_limit_exceeded'
  | 'execution_failed';

export interface ISubmissionTestCaseResult {
  testCaseIndex: number;
  isPassed: boolean;
  status: string;
  isPublic: boolean;
  executionTimeMs?: number;
  memoryUsedKb?: number;
  errorMessage?: string;
  actualOutput?: string;
  // Note: For private test cases, input and expectedOutput are intentionally excluded!
}

export interface ICodeSubmissionData {
  studentId: Types.ObjectId;
  questionId: Types.ObjectId;
  assessmentId?: Types.ObjectId;
  attemptId?: Types.ObjectId;
  language: SupportedLanguage;
  sourceCode: string;
  status: SubmissionStatus;
  passedTestCasesCount: number;
  totalTestCasesCount: number;
  testCaseResults: ISubmissionTestCaseResult[];
  scoreAwarded: number;
  maxScore: number;
  executionDurationMs: number;
  compilationError?: string;
  runtimeError?: string;
  aiFeedback?: {
    explanation?: string;
    mistakeAnalysis?: string;
    optimizationSuggestion?: string;
    hints?: string[];
    generatedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ICodeSubmission extends Document, ICodeSubmissionData {
  _id: Types.ObjectId;
}

const submissionTestCaseResultSchema = new Schema<ISubmissionTestCaseResult>(
  {
    testCaseIndex: { type: Number, required: true },
    isPassed: { type: Boolean, required: true },
    status: { type: String, required: true },
    isPublic: { type: Boolean, required: true },
    executionTimeMs: { type: Number },
    memoryUsedKb: { type: Number },
    errorMessage: { type: String },
    actualOutput: { type: String },
  },
  { _id: false }
);

const codeSubmissionSchema = new Schema<ICodeSubmission>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'CodingQuestion',
      required: true,
      index: true,
    },
    assessmentId: {
      type: Schema.Types.ObjectId,
      ref: 'CodingAssessment',
      index: true,
    },
    attemptId: {
      type: Schema.Types.ObjectId,
      ref: 'AssessmentAttempt',
      index: true,
    },
    language: {
      type: String,
      enum: ['python', 'javascript', 'java', 'cpp'],
      required: true,
    },
    sourceCode: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: [
        'accepted',
        'wrong_answer',
        'compilation_error',
        'runtime_error',
        'time_limit_exceeded',
        'memory_limit_exceeded',
        'execution_failed',
      ],
      required: true,
      index: true,
    },
    passedTestCasesCount: {
      type: Number,
      required: true,
      default: 0,
    },
    totalTestCasesCount: {
      type: Number,
      required: true,
      default: 0,
    },
    testCaseResults: {
      type: [submissionTestCaseResultSchema],
      default: [],
    },
    scoreAwarded: {
      type: Number,
      required: true,
      default: 0,
    },
    maxScore: {
      type: Number,
      required: true,
      default: 10,
    },
    executionDurationMs: {
      type: Number,
      default: 0,
    },
    compilationError: {
      type: String,
    },
    runtimeError: {
      type: String,
    },
    aiFeedback: {
      explanation: { type: String },
      mistakeAnalysis: { type: String },
      optimizationSuggestion: { type: String },
      hints: { type: [String] },
      generatedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

codeSubmissionSchema.index({ studentId: 1, createdAt: -1 });

export const CodeSubmission = model<ICodeSubmission>(
  'CodeSubmission',
  codeSubmissionSchema
);

