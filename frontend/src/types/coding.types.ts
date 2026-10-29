export type SupportedLanguage = 'python' | 'javascript' | 'java' | 'cpp';

export type CodingDifficulty = 'Easy' | 'Medium' | 'Hard';

export type AssessmentType = 'practice' | 'timed' | 'role_based';

export type SubmissionStatus =
  | 'accepted'
  | 'wrong_answer'
  | 'compilation_error'
  | 'runtime_error'
  | 'time_limit_exceeded'
  | 'memory_limit_exceeded'
  | 'execution_failed';

export interface ISampleTestCase {
  input: string;
  output: string;
  explanation?: string;
}

export interface CodingQuestionSummary {
  _id: string;
  id?: string;
  title: string;
  slug: string;
  difficulty: CodingDifficulty;
  category: string;
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
}

export interface CodingQuestionDetail extends CodingQuestionSummary {
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  sampleTestCases: ISampleTestCase[];
  hints: string[];
  expectedOutcomes: string[];
}

export interface CodingAssessmentItem {
  _id: string;
  id?: string;
  title: string;
  slug: string;
  description: string;
  type: AssessmentType;
  targetRole?: string;
  categories: string[];
  questions: Array<{
    questionId: CodingQuestionSummary;
    marks: number;
    order: number;
  }>;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  supportedLanguages: SupportedLanguage[];
  maxAttempts: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
}

export interface AssessmentAttemptData {
  _id: string;
  id?: string;
  assessmentId: CodingAssessmentItem;
  studentId: string;
  attemptNumber: number;
  startedAt: string;
  expiresAt: string;
  submittedAt?: string;
  status: 'in_progress' | 'completed' | 'timed_out' | 'abandoned';
  questionSubmissions: Array<{
    questionId: CodingQuestionDetail;
    submissionId?: string;
    marksAwarded: number;
  }>;
  totalScore: number;
  passed: boolean;
  timeTakenSeconds?: number;
  feedbackSummary?: string;
}

export interface RunSampleResult {
  status: SubmissionStatus;
  totalSampleCases: number;
  passedSampleCases: number;
  testCaseResults: Array<{
    input: string;
    expectedOutput: string;
    actualOutput?: string;
    status: string;
    isPassed: boolean;
    executionTimeMs: number;
    errorDetails?: string;
  }>;
  compilationError?: string;
  runtimeError?: string;
  executionDurationMs: number;
}

export interface CodeSubmissionResult {
  _id: string;
  id?: string;
  studentId: string;
  questionId: string | CodingQuestionSummary;
  assessmentId?: string | CodingAssessmentItem;
  language: SupportedLanguage;
  sourceCode: string;
  status: SubmissionStatus;
  passedTestCasesCount: number;
  totalTestCasesCount: number;
  testCaseResults: Array<{
    testCaseIndex: number;
    isPassed: boolean;
    status: string;
    isPublic: boolean;
    executionTimeMs?: number;
    memoryUsedKb?: number;
    errorMessage?: string;
    actualOutput?: string;
  }>;
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
    generatedAt?: string;
  };
  createdAt: string;
}

export interface CategoryProficiency {
  category: string;
  problemsSolved: number;
  totalAttempted: number;
  accuracyPercentage: number;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface StudentSkillSummaryData {
  overallCodingScore: number;
  totalProblemsSolved: number;
  totalSubmissions: number;
  categoryProficiencies: CategoryProficiency[];
  languageProficiencies: Array<{
    language: string;
    problemsSolved: number;
    lastUsed: string;
  }>;
  strengths: string[];
  areasForImprovement: string[];
}

export interface SandboxStatusData {
  provider: 'judge0' | 'piston' | 'mock';
  isConfigured: boolean;
  supportedLanguages: SupportedLanguage[];
  details: string;
}

