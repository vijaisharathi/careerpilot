import { Types } from 'mongoose';
import {
  CodingAssessment,
  ICodingAssessment,
  AssessmentType,
} from '../models/codingAssessment.model';
import {
  AssessmentAttempt,
  IAssessmentAttempt,
} from '../models/assessmentAttempt.model';
import { CodingQuestion } from '../models/codingQuestion.model';
import { codingQuestionService } from './codingQuestion.service';
import { AuditLog } from '../models/auditLog.model';

export class CodingAssessmentService {
  /**
   * Retrieves published assessments for students.
   */
  public async getAssessmentsForStudents(query?: {
    type?: string;
    category?: string;
    targetRole?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    assessments: any[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    const filter: Record<string, any> = { status: 'published' };

    if (query?.type && query.type !== 'all') {
      filter.type = query.type;
    }
    if (query?.category && query.category !== 'all') {
      filter.categories = query.category;
    }
    if (query?.targetRole && query.targetRole !== 'all') {
      filter.targetRole = new RegExp(query.targetRole, 'i');
    }

    const page = Math.max(1, query?.page || 1);
    const limit = Math.min(50, Math.max(1, query?.limit || 10));
    const skip = (page - 1) * limit;

    const [assessments, totalCount] = await Promise.all([
      CodingAssessment.find(filter)
        .populate('questions.questionId', 'title slug difficulty category timeLimitMs')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CodingAssessment.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return {
      assessments,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Retrieves single assessment details for student view.
   */
  public async getAssessmentDetail(idOrSlug: string): Promise<any> {
    let assessment: any = null;

    if (Types.ObjectId.isValid(idOrSlug)) {
      assessment = await CodingAssessment.findById(idOrSlug)
        .populate('questions.questionId', 'title slug difficulty category description sampleTestCases starterCode timeLimitMs constraints')
        .lean();
    }
    if (!assessment) {
      assessment = await CodingAssessment.findOne({ slug: idOrSlug.toLowerCase() })
        .populate('questions.questionId', 'title slug difficulty category description sampleTestCases starterCode timeLimitMs constraints')
        .lean();
    }

    if (!assessment || assessment.status === 'archived') {
      throw new Error('Assessment not found or is no longer accessible.');
    }

    return assessment;
  }

  /**
   * Starts a new assessment attempt for an authenticated student.
   * Server-enforced start time and deadline guarantee tamper-proof durations.
   */
  public async startAttempt(
    studentId: string,
    assessmentId: string,
    clientIp?: string
  ): Promise<IAssessmentAttempt> {
    const assessment = await CodingAssessment.findById(assessmentId);
    if (!assessment || assessment.status !== 'published') {
      throw new Error('This assessment is not currently published or available.');
    }

    const now = new Date();
    if (assessment.startTime && now < assessment.startTime) {
      throw new Error(`This assessment will open on ${assessment.startTime.toLocaleString()}.`);
    }
    if (assessment.endTime && now > assessment.endTime) {
      throw new Error('This assessment deadline has passed.');
    }

    // Check active attempt in progress
    const activeAttempt = await AssessmentAttempt.findOne({
      studentId: new Types.ObjectId(studentId),
      assessmentId: assessment._id,
      status: 'in_progress',
    });

    if (activeAttempt) {
      // Check if active attempt has expired on server
      if (now > activeAttempt.expiresAt) {
        activeAttempt.status = 'timed_out';
        await activeAttempt.save();
      } else {
        return activeAttempt; // Resume active session
      }
    }

    // Check attempt limits
    const previousAttemptsCount = await AssessmentAttempt.countDocuments({
      studentId: new Types.ObjectId(studentId),
      assessmentId: assessment._id,
    });

    if (assessment.maxAttempts > 0 && previousAttemptsCount >= assessment.maxAttempts) {
      throw new Error(
        `Attempt limit reached. You have already completed ${previousAttemptsCount} of ${assessment.maxAttempts} allowed attempts.`
      );
    }

    // Server-enforced duration calculation
    const durationMinutes = assessment.durationMinutes > 0 ? assessment.durationMinutes : 1440; // 24 hours for practice
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    const newAttempt = new AssessmentAttempt({
      assessmentId: assessment._id,
      studentId: new Types.ObjectId(studentId),
      attemptNumber: previousAttemptsCount + 1,
      startedAt: now,
      expiresAt,
      status: 'in_progress',
      questionSubmissions: assessment.questions.map((q) => ({
        questionId: q.questionId,
        marksAwarded: 0,
      })),
      totalScore: 0,
      passed: false,
      clientIp,
    });

    await newAttempt.save();
    return newAttempt;
  }

  /**
   * Retrieves an assessment attempt with strict multi-tenant authorization.
   */
  public async getAttempt(attemptId: string, studentId: string): Promise<IAssessmentAttempt> {
    const attempt = await AssessmentAttempt.findById(attemptId)
      .populate('assessmentId', 'title slug durationMinutes totalMarks passingMarks type questions')
      .populate('questionSubmissions.questionId', 'title slug difficulty category constraints sampleTestCases starterCode');

    if (!attempt) {
      throw new Error('Assessment attempt session not found.');
    }

    if (attempt.studentId.toString() !== studentId) {
      throw new Error('Unauthorized: You cannot access another candidate’s assessment session.');
    }

    // Check server deadline
    if (attempt.status === 'in_progress' && new Date() > attempt.expiresAt) {
      attempt.status = 'timed_out';
      await attempt.save();
    }

    return attempt;
  }

  /**
   * Finalizes an assessment attempt, calculating final score and passing status.
   */
  public async completeAttempt(attemptId: string, studentId: string): Promise<IAssessmentAttempt> {
    const attempt = await this.getAttempt(attemptId, studentId);

    if (attempt.status === 'completed') {
      return attempt;
    }

    const now = new Date();
    const isTimedOut = now > attempt.expiresAt;
    attempt.status = isTimedOut ? 'timed_out' : 'completed';
    attempt.submittedAt = now;
    attempt.timeTakenSeconds = Math.round((now.getTime() - attempt.startedAt.getTime()) / 1000);

    const assessment = await CodingAssessment.findById(attempt.assessmentId);
    if (assessment) {
      attempt.passed = attempt.totalScore >= assessment.passingMarks;
      attempt.feedbackSummary = attempt.passed
        ? `Passed with ${attempt.totalScore}/${assessment.totalMarks} marks.`
        : `Scored ${attempt.totalScore}/${assessment.totalMarks} marks. Passing score is ${assessment.passingMarks}.`;
    }

    await attempt.save();
    return attempt;
  }

  /**
   * Admin: Creates a new assessment.
   */
  public async createAssessment(
    actor: { id: string; email: string; name: string },
    payload: Partial<ICodingAssessment>
  ): Promise<ICodingAssessment> {
    const baseSlug = (payload.title || 'assessment')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    let slug = baseSlug;
    let count = 1;
    while (await CodingAssessment.exists({ slug })) {
      slug = `${baseSlug}-${count++}`;
    }

    const assessment = new CodingAssessment({
      ...payload,
      slug,
      createdBy: new Types.ObjectId(actor.id),
    });

    await assessment.save();

    await AuditLog.create({
      eventType: 'coding_assessment_created',
      actorId: new Types.ObjectId(actor.id),
      actorEmail: actor.email,
      actorName: actor.name,
      targetId: assessment._id.toString(),
      targetType: 'CodingAssessment',
      action: `Created coding assessment: ${assessment.title}`,
      status: 'success',
      createdAt: new Date(),
    });

    return assessment;
  }

  /**
   * Seeds initial standard assessments if none exist.
   */
  public async seedInitialAssessmentsIfEmpty(): Promise<void> {
    const count = await CodingAssessment.countDocuments();
    if (count > 0) return;

    await codingQuestionService.seedInitialQuestionsIfEmpty();
    const questions = await CodingQuestion.find({ status: 'active' }).limit(5);
    if (questions.length === 0) return;

    const initialAssessments = [
      {
        title: 'Full-Stack Developer Technical Assessment',
        slug: 'full-stack-developer-technical-assessment',
        description:
          'Evaluates core problem solving, algorithmic efficiency, and foundational data structures for prospective Full-Stack Engineering roles.',
        type: 'role_based' as AssessmentType,
        targetRole: 'Full-Stack Developer',
        categories: ['Arrays & Strings', 'Searching & Sorting', 'Algorithms'],
        questions: questions.slice(0, 3).map((q, idx) => ({
          questionId: q._id,
          marks: 30,
          order: idx + 1,
        })),
        durationMinutes: 60,
        totalMarks: 90,
        passingMarks: 60,
        supportedLanguages: ['python', 'javascript', 'java', 'cpp'] as any,
        maxAttempts: 2,
        status: 'published' as const,
      },
      {
        title: 'Algorithms & Problem Solving Practice',
        slug: 'algorithms-problem-solving-practice',
        description:
          'Open practice assessment without a strict time limit. Test your problem-solving speed and receive instant algorithmic verification.',
        type: 'practice' as AssessmentType,
        targetRole: 'Software Engineer',
        categories: ['Programming Fundamentals', 'Recursion', 'Searching & Sorting'],
        questions: questions.map((q, idx) => ({
          questionId: q._id,
          marks: 20,
          order: idx + 1,
        })),
        durationMinutes: 0, // Untimed practice
        totalMarks: 100,
        passingMarks: 60,
        supportedLanguages: ['python', 'javascript', 'java', 'cpp'] as any,
        maxAttempts: 0, // Unlimited attempts
        status: 'published' as const,
      },
    ];

    await CodingAssessment.insertMany(initialAssessments);
  }
}

export const codingAssessmentService = new CodingAssessmentService();

