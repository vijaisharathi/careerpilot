import { Schema, model, Document, Types } from 'mongoose';

export type CodingDifficulty = 'Easy' | 'Medium' | 'Hard';

export type SupportedLanguage = 'python' | 'javascript' | 'java' | 'cpp';

export type CodingCategory =
  | 'Programming Fundamentals'
  | 'Arrays & Strings'
  | 'Searching & Sorting'
  | 'Recursion'
  | 'Data Structures'
  | 'Algorithms'
  | 'Object-Oriented Programming'
  | 'SQL Fundamentals'
  | 'Problem Solving'
  | 'Basic Database Concepts';

export interface ISampleTestCase {
  input: string;
  output: string;
  explanation?: string;
}

export interface IPrivateTestCase {
  input: string;
  output: string;
  weight?: number;
  isHidden: boolean;
}

export interface ICodingQuestionData {
  title: string;
  slug: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  difficulty: CodingDifficulty;
  category: CodingCategory | string;
  topicTags: string[];
  supportedLanguages: SupportedLanguage[];
  timeLimitMs: number;
  memoryLimitMb: number;
  starterCode: {
    python?: string;
    javascript?: string;
    java?: string;
    cpp?: string;
  };
  sampleTestCases: ISampleTestCase[];
  privateTestCases: IPrivateTestCase[];
  hints: string[];
  editorial?: string;
  expectedOutcomes: string[];
  status: 'draft' | 'active' | 'archived';
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICodingQuestion extends Document, ICodingQuestionData {
  _id: Types.ObjectId;
}

const sampleTestCaseSchema = new Schema<ISampleTestCase>(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String, trim: true },
  },
  { _id: false }
);

const privateTestCaseSchema = new Schema<IPrivateTestCase>(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
    weight: { type: Number, default: 1 },
    isHidden: { type: Boolean, default: true },
  },
  { _id: false }
);

const codingQuestionSchema = new Schema<ICodingQuestion>(
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
    inputFormat: {
      type: String,
      required: true,
    },
    outputFormat: {
      type: String,
      required: true,
    },
    constraints: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    topicTags: {
      type: [String],
      default: [],
      index: true,
    },
    supportedLanguages: {
      type: [String],
      enum: ['python', 'javascript', 'java', 'cpp'],
      default: ['python', 'javascript', 'java', 'cpp'],
    },
    timeLimitMs: {
      type: Number,
      default: 2000,
    },
    memoryLimitMb: {
      type: Number,
      default: 256,
    },
    starterCode: {
      python: { type: String, default: '' },
      javascript: { type: String, default: '' },
      java: { type: String, default: '' },
      cpp: { type: String, default: '' },
    },
    sampleTestCases: {
      type: [sampleTestCaseSchema],
      default: [],
    },
    privateTestCases: {
      type: [privateTestCaseSchema],
      default: [],
    },
    hints: {
      type: [String],
      default: [],
    },
    editorial: {
      type: String,
      trim: true,
    },
    expectedOutcomes: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'active',
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

codingQuestionSchema.index({ category: 1, difficulty: 1, status: 1 });

export const CodingQuestion = model<ICodingQuestion>(
  'CodingQuestion',
  codingQuestionSchema
);

