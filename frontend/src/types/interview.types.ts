export type InterviewType = 'technical' | 'hr';
export type InterviewDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type InterviewSessionStatus = 'in_progress' | 'completed' | 'abandoned';

export interface IQuestionEvaluation {
  overallScore: number;
  correctness: number;
  completeness: number;
  clarity: number;
  strengths: string[];
  missingConcepts: string[];
  feedback: string;
  suggestedImprovedAnswer: string;
  isUncertainAssessment: boolean;
  rubricExplanation: string;
}

export interface IInterviewQuestion {
  _id: string;
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
  answeredAt?: string;
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
  completedAt: string;
}

export interface IInterviewSession {
  _id: string;
  user: string;
  targetRole: string;
  interviewType: InterviewType;
  difficulty: InterviewDifficulty;
  topics: string[];
  status: InterviewSessionStatus;
  questions: IInterviewQuestion[];
  currentQuestionIndex: number;
  totalQuestions: number;
  summary?: IInterviewSessionSummary;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInterviewPayload {
  targetRole: string;
  interviewType?: InterviewType;
  difficulty?: InterviewDifficulty;
  questionCount?: number;
  topics?: string[];
}

export interface SubmitAnswerPayload {
  questionIndex: number;
  studentAnswer: string;
}

export interface StudentSessionStats {
  totalSessions: number;
  completedSessions: number;
  totalQuestionsAnswered: number;
  averageOverallScore: number;
  technicalAverage: number;
  hrAverage: number;
  topStrengths: string[];
  topAreasToImprove: string[];
}

