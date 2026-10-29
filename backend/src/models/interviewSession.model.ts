import { Schema, model, Document, Types } from 'mongoose';

export type InterviewType = 'technical' | 'hr';
export type InterviewDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type InterviewSessionStatus = 'in_progress' | 'completed' | 'abandoned';

export interface IQuestionEvaluation {
  overallScore: number; // 0 - 100
  correctness: number; // 0 - 100 (Technical accuracy or HR situational relevance)
  completeness: number; // 0 - 100 (Coverage of essential concepts)
  clarity: number; // 0 - 100 (Structure and articulation)
  strengths: string[];
  missingConcepts: string[];
  feedback: string;
  suggestedImprovedAnswer: string;
  isUncertainAssessment: boolean;
  rubricExplanation: string;
}

export interface IInterviewQuestion {
  _id: Types.ObjectId;
  questionIndex: number;
  category: InterviewType;
  topic: string;
  difficulty: InterviewDifficulty;
  questionText: string;
  contextOrScenario?: string;
  hints?: string[];
  expectedKeyConcepts: string[];
  idealAnswerOutline?: string;
  studentAnswer?: string;
  answeredAt?: Date;
  evaluation?: IQuestionEvaluation;
}

export interface IInterviewSessionSummary {
  overallScore: number;
  averageCorrectness: number;
  averageCompleteness: number;
  averageClarity: number;
  totalAnswered: number;
  keyStrengths: string[];
  areasForImprovement: string[];
  overallRecommendation: string;
  completedAt: Date;
}

export interface IInterviewSessionData {
  user: Types.ObjectId;
  targetRole: string;
  interviewType: InterviewType;
  difficulty: InterviewDifficulty;
  topics: string[];
  status: InterviewSessionStatus;
  questions: IInterviewQuestion[];
  currentQuestionIndex: number;
  totalQuestions: number;
  summary?: IInterviewSessionSummary;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInterviewSession extends Document, IInterviewSessionData {
  _id: Types.ObjectId;
}

const questionEvaluationSchema = new Schema<IQuestionEvaluation>(
  {
    overallScore: { type: Number, required: true, min: 0, max: 100 },
    correctness: { type: Number, required: true, min: 0, max: 100 },
    completeness: { type: Number, required: true, min: 0, max: 100 },
    clarity: { type: Number, required: true, min: 0, max: 100 },
    strengths: { type: [String], default: [] },
    missingConcepts: { type: [String], default: [] },
    feedback: { type: String, required: true },
    suggestedImprovedAnswer: { type: String, required: true },
    isUncertainAssessment: { type: Boolean, default: false },
    rubricExplanation: { type: String, required: true },
  },
  { _id: false }
);

const interviewQuestionSchema = new Schema<IInterviewQuestion>({
  questionIndex: { type: Number, required: true },
  category: { type: String, enum: ['technical', 'hr'], required: true },
  topic: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true,
  },
  questionText: { type: String, required: true },
  contextOrScenario: { type: String, default: '' },
  hints: { type: [String], default: [] },
  expectedKeyConcepts: { type: [String], default: [] },
  idealAnswerOutline: { type: String, default: '' },
  studentAnswer: { type: String, default: '' },
  answeredAt: { type: Date },
  evaluation: { type: questionEvaluationSchema },
});

const interviewSessionSummarySchema = new Schema<IInterviewSessionSummary>(
  {
    overallScore: { type: Number, required: true, min: 0, max: 100 },
    averageCorrectness: { type: Number, required: true, min: 0, max: 100 },
    averageCompleteness: { type: Number, required: true, min: 0, max: 100 },
    averageClarity: { type: Number, required: true, min: 0, max: 100 },
    totalAnswered: { type: Number, required: true },
    keyStrengths: { type: [String], default: [] },
    areasForImprovement: { type: [String], default: [] },
    overallRecommendation: { type: String, required: true },
    completedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const interviewSessionSchema = new Schema<IInterviewSession>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetRole: { type: String, required: true, trim: true },
    interviewType: {
      type: String,
      enum: ['technical', 'hr'],
      required: true,
      default: 'technical',
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      required: true,
      default: 'Intermediate',
    },
    topics: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress',
      index: true,
    },
    questions: { type: [interviewQuestionSchema], default: [] },
    currentQuestionIndex: { type: Number, default: 0 },
    totalQuestions: { type: Number, required: true, min: 1, max: 15 },
    summary: { type: interviewSessionSummarySchema },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

interviewSessionSchema.index({ user: 1, status: 1 });
interviewSessionSchema.index({ user: 1, createdAt: -1 });

export const InterviewSession = model<IInterviewSession>(
  'InterviewSession',
  interviewSessionSchema
);

