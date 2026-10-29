import { z } from 'zod';

export const supportedLanguageSchema = z.enum(['python', 'javascript', 'java', 'cpp']);

export const codingDifficultySchema = z.enum(['Easy', 'Medium', 'Hard']);

export const sampleTestCaseSchema = z.object({
  input: z.string().min(1, 'Sample input cannot be empty'),
  output: z.string().min(1, 'Sample output cannot be empty'),
  explanation: z.string().optional(),
});

export const privateTestCaseSchema = z.object({
  input: z.string().min(1, 'Test input cannot be empty'),
  output: z.string().min(1, 'Test output cannot be empty'),
  weight: z.number().min(1).default(1),
  isHidden: z.boolean().default(true),
});

export const createQuestionSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    inputFormat: z.string().min(3, 'Input format specification is required'),
    outputFormat: z.string().min(3, 'Output format specification is required'),
    constraints: z.string().min(3, 'Constraints specification is required'),
    difficulty: codingDifficultySchema,
    category: z.string().min(2, 'Category is required'),
    topicTags: z.array(z.string()).default([]),
    supportedLanguages: z.array(supportedLanguageSchema).default(['python', 'javascript', 'java', 'cpp']),
    timeLimitMs: z.number().min(500).max(10000).default(2000),
    memoryLimitMb: z.number().min(64).max(1024).default(256),
    starterCode: z
      .object({
        python: z.string().optional(),
        javascript: z.string().optional(),
        java: z.string().optional(),
        cpp: z.string().optional(),
      })
      .default({}),
    sampleTestCases: z.array(sampleTestCaseSchema).min(1, 'At least 1 sample test case is required'),
    privateTestCases: z.array(privateTestCaseSchema).min(1, 'At least 1 private evaluation test case is required'),
    hints: z.array(z.string()).default([]),
    editorial: z.string().optional(),
    expectedOutcomes: z.array(z.string()).default([]),
    status: z.enum(['draft', 'active', 'archived']).default('active'),
  }),
});

export const updateQuestionSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    inputFormat: z.string().optional(),
    outputFormat: z.string().optional(),
    constraints: z.string().optional(),
    difficulty: codingDifficultySchema.optional(),
    category: z.string().optional(),
    topicTags: z.array(z.string()).optional(),
    supportedLanguages: z.array(supportedLanguageSchema).optional(),
    timeLimitMs: z.number().optional(),
    memoryLimitMb: z.number().optional(),
    starterCode: z.record(z.string()).optional(),
    sampleTestCases: z.array(sampleTestCaseSchema).optional(),
    privateTestCases: z.array(privateTestCaseSchema).optional(),
    hints: z.array(z.string()).optional(),
    editorial: z.string().optional(),
    status: z.enum(['draft', 'active', 'archived']).optional(),
  }),
});

export const createAssessmentSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Assessment title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    type: z.enum(['practice', 'timed', 'role_based']),
    targetRole: z.string().optional(),
    categories: z.array(z.string()).default([]),
    questions: z
      .array(
        z.object({
          questionId: z.string().min(1, 'Question ID is required'),
          marks: z.number().min(1).default(10),
          order: z.number().min(1).default(1),
        })
      )
      .min(1, 'Assessment must contain at least 1 question'),
    durationMinutes: z.number().min(0).max(300).default(60),
    totalMarks: z.number().min(1).default(100),
    passingMarks: z.number().min(1).default(60),
    supportedLanguages: z.array(supportedLanguageSchema).default(['python', 'javascript', 'java', 'cpp']),
    maxAttempts: z.number().min(0).max(10).default(3),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    status: z.enum(['draft', 'published', 'archived']).default('published'),
  }),
});

export const runSampleCodeSchema = z.object({
  body: z.object({
    questionId: z.string().min(1, 'Question ID is required'),
    language: supportedLanguageSchema,
    sourceCode: z.string().min(1, 'Source code cannot be empty').max(64 * 1024, 'Code exceeds 64KB limit'),
  }),
});

export const submitSolutionSchema = z.object({
  body: z.object({
    questionId: z.string().min(1, 'Question ID is required'),
    language: supportedLanguageSchema,
    sourceCode: z.string().min(1, 'Source code cannot be empty').max(64 * 1024, 'Code exceeds 64KB limit'),
    assessmentId: z.string().optional(),
    attemptId: z.string().optional(),
  }),
});

export const startAttemptSchema = z.object({
  body: z.object({
    assessmentId: z.string().min(1, 'Assessment ID is required'),
  }),
});

