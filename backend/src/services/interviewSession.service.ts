import { Types } from 'mongoose';
import {
  InterviewSession,
  IInterviewSession,
  InterviewType,
  InterviewDifficulty,
  IInterviewSessionSummary,
} from '../models/interviewSession.model';
import { interviewQuestionService } from './interviewQuestion.service';
import { interviewEvaluatorService } from './interviewEvaluator.service';
import { AppError } from '../utils/appError';

export interface CreateInterviewSessionInput {
  targetRole: string;
  interviewType?: InterviewType;
  difficulty?: InterviewDifficulty;
  questionCount?: number;
  topics?: string[];
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

export class InterviewSessionService {
  /**
   * Starts a new interview session and generates role-relevant questions.
   */
  public async createSession(
    userId: string,
    input: CreateInterviewSessionInput
  ): Promise<IInterviewSession> {
    const targetRole = input.targetRole?.trim();
    if (!targetRole) {
      throw new AppError('Target career role is required to start an interview session.', 400);
    }

    const interviewType = input.interviewType || 'technical';
    const difficulty = input.difficulty || 'Intermediate';
    const questionCount = Math.max(1, Math.min(10, input.questionCount || 3));
    const topics = input.topics || [];

    // Generate questions for the session
    const questions = await interviewQuestionService.generateQuestions({
      targetRole,
      interviewType,
      difficulty,
      questionCount,
      topics,
    });

    const session = new InterviewSession({
      user: new Types.ObjectId(userId),
      targetRole,
      interviewType,
      difficulty,
      topics,
      status: 'in_progress',
      questions,
      currentQuestionIndex: 0,
      totalQuestions: questions.length,
      startedAt: new Date(),
    });

    await session.save();
    return session;
  }

  /**
   * Retrieves an interview session ensuring student ownership.
   */
  public async getSessionById(sessionId: string, userId: string): Promise<IInterviewSession> {
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new AppError('Invalid session ID format.', 400);
    }

    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      throw new AppError('Interview session not found.', 404);
    }

    if (session.user.toString() !== userId) {
      throw new AppError('You are not authorized to access this interview session.', 403);
    }

    return session;
  }

  /**
   * Retrieves the current in-progress session for recovery.
   */
  public async getCurrentSession(userId: string): Promise<IInterviewSession | null> {
    return InterviewSession.findOne({
      user: new Types.ObjectId(userId),
      status: 'in_progress',
    }).sort({ createdAt: -1 });
  }

  /**
   * Submits an answer to a question and evaluates it against the rubric.
   */
  public async submitAnswer(
    sessionId: string,
    userId: string,
    questionIndex: number,
    studentAnswer: string
  ): Promise<IInterviewSession> {
    const session = await this.getSessionById(sessionId, userId);

    if (session.status !== 'in_progress') {
      throw new AppError('This interview session is already closed or completed.', 400);
    }

    if (questionIndex < 0 || questionIndex >= session.questions.length) {
      throw new AppError(
        `Invalid question index ${questionIndex}. Session has ${session.questions.length} questions.`,
        400
      );
    }

    const cleanAnswer = studentAnswer?.trim();
    if (!cleanAnswer || cleanAnswer.length < 5) {
      throw new AppError('Please provide a substantive answer (at least 5 characters).', 400);
    }

    const question = session.questions[questionIndex];

    // Evaluate answer against transparent rubrics
    const evaluation = await interviewEvaluatorService.evaluateAnswer({
      question,
      studentAnswer: cleanAnswer,
      targetRole: session.targetRole,
    });

    // Record response and evaluation
    question.studentAnswer = cleanAnswer;
    question.answeredAt = new Date();
    question.evaluation = evaluation;

    // Check if all questions have been answered
    const answeredCount = session.questions.filter((q) => Boolean(q.studentAnswer)).length;
    const isFinished = answeredCount >= session.questions.length;

    if (isFinished) {
      session.status = 'completed';
      session.completedAt = new Date();
      session.summary = this.calculateSessionSummary(session);
    } else {
      // Advance question index if current was answered
      if (questionIndex === session.currentQuestionIndex && questionIndex + 1 < session.questions.length) {
        session.currentQuestionIndex = questionIndex + 1;
      }
    }

    await session.save();
    return session;
  }

  /**
   * Abandons an in-progress session.
   */
  public async abandonSession(sessionId: string, userId: string): Promise<IInterviewSession> {
    const session = await this.getSessionById(sessionId, userId);
    session.status = 'abandoned';
    await session.save();
    return session;
  }

  /**
   * Retrieves all interview sessions for the student.
   */
  public async getStudentSessions(userId: string): Promise<IInterviewSession[]> {
    return InterviewSession.find({ user: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean() as unknown as Promise<IInterviewSession[]>;
  }

  /**
   * Computes aggregate progress statistics across all completed sessions.
   */
  public async getSessionStats(userId: string): Promise<StudentSessionStats> {
    const sessions = await InterviewSession.find({
      user: new Types.ObjectId(userId),
    }).lean();

    const completed = sessions.filter((s) => s.status === 'completed' && s.summary);

    if (completed.length === 0) {
      return {
        totalSessions: sessions.length,
        completedSessions: 0,
        totalQuestionsAnswered: sessions.reduce(
          (acc, s) => acc + s.questions.filter((q) => Boolean(q.studentAnswer)).length,
          0
        ),
        averageOverallScore: 0,
        technicalAverage: 0,
        hrAverage: 0,
        topStrengths: [],
        topAreasToImprove: [],
      };
    }

    const technicalCompleted = completed.filter((s) => s.interviewType === 'technical');
    const hrCompleted = completed.filter((s) => s.interviewType === 'hr');

    const avgOverall = Math.round(
      completed.reduce((acc, s) => acc + (s.summary?.overallScore || 0), 0) / completed.length
    );

    const technicalAvg =
      technicalCompleted.length > 0
        ? Math.round(
            technicalCompleted.reduce((acc, s) => acc + (s.summary?.overallScore || 0), 0) /
              technicalCompleted.length
          )
        : 0;

    const hrAvg =
      hrCompleted.length > 0
        ? Math.round(
            hrCompleted.reduce((acc, s) => acc + (s.summary?.overallScore || 0), 0) /
              hrCompleted.length
          )
        : 0;

    const allStrengths = completed.flatMap((s) => s.summary?.keyStrengths || []);
    const allImprovements = completed.flatMap((s) => s.summary?.areasForImprovement || []);

    const totalQuestions = sessions.reduce(
      (acc, s) => acc + s.questions.filter((q) => Boolean(q.studentAnswer)).length,
      0
    );

    return {
      totalSessions: sessions.length,
      completedSessions: completed.length,
      totalQuestionsAnswered: totalQuestions,
      averageOverallScore: avgOverall,
      technicalAverage: technicalAvg,
      hrAverage: hrAvg,
      topStrengths: Array.from(new Set(allStrengths)).slice(0, 5),
      topAreasToImprove: Array.from(new Set(allImprovements)).slice(0, 5),
    };
  }

  private calculateSessionSummary(session: IInterviewSession): IInterviewSessionSummary {
    const evaluatedQuestions = session.questions.filter((q) => q.evaluation);
    const count = Math.max(1, evaluatedQuestions.length);

    const sumScore = evaluatedQuestions.reduce((acc, q) => acc + q.evaluation!.overallScore, 0);
    const sumCorrectness = evaluatedQuestions.reduce((acc, q) => acc + q.evaluation!.correctness, 0);
    const sumCompleteness = evaluatedQuestions.reduce((acc, q) => acc + q.evaluation!.completeness, 0);
    const sumClarity = evaluatedQuestions.reduce((acc, q) => acc + q.evaluation!.clarity, 0);

    const overallScore = Math.round(sumScore / count);
    const averageCorrectness = Math.round(sumCorrectness / count);
    const averageCompleteness = Math.round(sumCompleteness / count);
    const averageClarity = Math.round(sumClarity / count);

    // Aggregate strengths & missing concepts
    const strengthsSet = new Set<string>();
    const improvementsSet = new Set<string>();

    for (const q of evaluatedQuestions) {
      q.evaluation!.strengths.forEach((s) => strengthsSet.add(s));
      q.evaluation!.missingConcepts.forEach((m) =>
        improvementsSet.add(`Master ${m} for ${q.topic}`)
      );
    }

    let overallRecommendation = '';
    if (overallScore >= 85) {
      overallRecommendation = `Outstanding interview performance for ${session.targetRole}! You demonstrated strong conceptual depth, clear articulation, and reliable solution structure.`;
    } else if (overallScore >= 70) {
      overallRecommendation = `Solid foundational interview performance for ${session.targetRole}. Continue practicing concise explanation of trade-offs and covering edge cases.`;
    } else {
      overallRecommendation = `Developing performance. Focus on reviewing target skill concepts and structuring responses with the STAR method or technical system diagrams.`;
    }

    return {
      overallScore,
      averageCorrectness,
      averageCompleteness,
      averageClarity,
      totalAnswered: count,
      keyStrengths: Array.from(strengthsSet).slice(0, 4),
      areasForImprovement: Array.from(improvementsSet).slice(0, 4),
      overallRecommendation,
      completedAt: new Date(),
    };
  }
}

export const interviewSessionService = new InterviewSessionService();

