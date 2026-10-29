import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { codingQuestionService } from '../services/codingQuestion.service';
import { codingAssessmentService } from '../services/codingAssessment.service';
import { codeEvaluationService } from '../services/codeEvaluation.service';
import { codeExecutionService } from '../services/codeExecution.service';
import { placementCodingIntegrationService } from '../services/placementCodingIntegration.service';
import { StudentSkillAssessmentSummary } from '../models/studentSkillAssessmentSummary.model';
import { Types } from 'mongoose';

export class CodingController {
  private getStudentUser(req: Request): { id: string; email: string; name: string } {
    const user = (req as any).user;
    if (!user || (!user.userId && !user.id)) {
      throw new Error('Authenticated student context required');
    }
    const id = user.userId || user.id;
    return {
      id,
      email: user.email,
      name: user.name || (user.email ? user.email.split('@')[0] : 'Student'),
    };
  }

  private getActor(req: Request): { id: string; email: string; name: string; role: string; institutionId?: string } {
    const user = (req as any).user;
    if (!user || (!user.userId && !user.id)) {
      throw new Error('Authenticated actor context required');
    }
    const id = user.userId || user.id;
    return {
      id,
      email: user.email,
      name: user.name || (user.email ? user.email.split('@')[0] : 'User'),
      role: user.role,
      institutionId: user.institutionId,
    };
  }

  // --- Questions (Student View) ---

  public getQuestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = req.query.category as string;
      const difficulty = req.query.difficulty as string;
      const search = req.query.search as string;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 12;

      const result = await codingQuestionService.getQuestionsForStudents({
        category,
        difficulty,
        search,
        page,
        limit,
      });

      sendSuccess(res, result, 'Coding questions retrieved successfully');
    } catch (err) {
      next(err);
    }
  };

  public getQuestionDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idOrSlug = req.params.idOrSlug;
      const question = await codingQuestionService.getQuestionByIdOrSlug(idOrSlug);
      sendSuccess(res, question, 'Question details retrieved successfully');
    } catch (err) {
      next(err);
    }
  };

  // --- Assessments (Student View) ---

  public getAssessments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const type = req.query.type as string;
      const category = req.query.category as string;
      const targetRole = req.query.targetRole as string;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const result = await codingAssessmentService.getAssessmentsForStudents({
        type,
        category,
        targetRole,
        page,
        limit,
      });

      sendSuccess(res, result, 'Coding assessments retrieved successfully');
    } catch (err) {
      next(err);
    }
  };

  public getAssessmentDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idOrSlug = req.params.idOrSlug;
      const assessment = await codingAssessmentService.getAssessmentDetail(idOrSlug);
      sendSuccess(res, assessment, 'Assessment details retrieved successfully');
    } catch (err) {
      next(err);
    }
  };

  public startAttempt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getStudentUser(req);
      const { assessmentId } = req.body;
      const clientIp = req.ip || req.socket.remoteAddress;

      const attempt = await codingAssessmentService.startAttempt(user.id, assessmentId, clientIp);
      sendCreated(res, attempt, 'Assessment session initialized');
    } catch (err) {
      next(err);
    }
  };

  public getAttempt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getStudentUser(req);
      const attemptId = req.params.attemptId;

      const attempt = await codingAssessmentService.getAttempt(attemptId, user.id);
      sendSuccess(res, attempt, 'Assessment session retrieved');
    } catch (err) {
      next(err);
    }
  };

  public finishAttempt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getStudentUser(req);
      const attemptId = req.params.attemptId;

      const attempt = await codingAssessmentService.completeAttempt(attemptId, user.id);
      sendSuccess(res, attempt, 'Assessment attempt finalized');
    } catch (err) {
      next(err);
    }
  };

  // --- Code Execution & Evaluation ---

  public runSampleCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getStudentUser(req);
      const { questionId, language, sourceCode } = req.body;

      const result = await codeEvaluationService.runCodeSample(user.id, questionId, language, sourceCode);
      sendSuccess(res, result, 'Sample execution completed');
    } catch (err) {
      next(err);
    }
  };

  public submitSolution = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getStudentUser(req);
      const { questionId, language, sourceCode, assessmentId, attemptId } = req.body;

      const submission = await codeEvaluationService.submitSolution({
        studentId: user.id,
        questionId,
        language,
        sourceCode,
        assessmentId,
        attemptId,
      });

      sendCreated(res, submission, 'Solution evaluated and recorded');
    } catch (err) {
      next(err);
    }
  };

  public requestAiFeedback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getStudentUser(req);
      const submissionId = req.params.submissionId;

      const feedback = await codeEvaluationService.requestAiFeedback(user.id, submissionId);
      sendSuccess(res, feedback, 'AI pedagogical guidance generated');
    } catch (err) {
      next(err);
    }
  };

  // --- Submissions & Technical Profile ---

  public getSubmissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getStudentUser(req);
      const questionId = req.query.questionId as string;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const result = await codeEvaluationService.getStudentSubmissions(user.id, {
        questionId,
        page,
        limit,
      });

      sendSuccess(res, result, 'Submission history retrieved');
    } catch (err) {
      next(err);
    }
  };

  public getSubmissionDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getStudentUser(req);
      const submissionId = req.params.submissionId;

      const submission = await codeEvaluationService.getSubmissionDetail(submissionId, user.id);
      sendSuccess(res, submission, 'Submission details retrieved');
    } catch (err) {
      next(err);
    }
  };

  public getStudentSkillSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getStudentUser(req);
      const summary = await StudentSkillAssessmentSummary.findOne({
        studentId: new Types.ObjectId(user.id),
      });

      sendSuccess(
        res,
        summary || {
          overallCodingScore: 0,
          totalProblemsSolved: 0,
          totalSubmissions: 0,
          categoryProficiencies: [],
          languageProficiencies: [],
          strengths: [],
          areasForImprovement: [],
        },
        'Technical skill profile retrieved'
      );
    } catch (err) {
      next(err);
    }
  };

  public getExecutionEngineStatus = async (_req: Request, res: Response): Promise<void> => {
    const status = codeExecutionService.getStatus();
    sendSuccess(res, status, 'Execution sandbox status retrieved');
  };

  // --- Administrative Operations ---

  public createQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actor = this.getActor(req);
      const question = await codingQuestionService.createQuestion(actor, req.body);
      sendCreated(res, question, 'Coding question created successfully');
    } catch (err) {
      next(err);
    }
  };

  public updateQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actor = this.getActor(req);
      const questionId = req.params.id;
      const question = await codingQuestionService.updateQuestion(actor, questionId, req.body);
      sendSuccess(res, question, 'Coding question updated successfully');
    } catch (err) {
      next(err);
    }
  };

  public createAssessment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actor = this.getActor(req);
      const assessment = await codingAssessmentService.createAssessment(actor, req.body);
      sendCreated(res, assessment, 'Assessment created and published');
    } catch (err) {
      next(err);
    }
  };

  // --- Placement Officer Integration ---

  public getPlacementCodingAnalytics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const actor = this.getActor(req);
      const analytics = await placementCodingIntegrationService.getInstitutionalCodingAnalytics(actor);
      sendSuccess(res, analytics, 'Institutional coding analytics retrieved');
    } catch (err) {
      next(err);
    }
  };

  public getCandidateTechnicalSummary = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const actor = this.getActor(req);
      const studentId = req.params.studentId;
      const summary = await placementCodingIntegrationService.getCandidateTechnicalSummary(actor, studentId);
      sendSuccess(res, summary, 'Candidate technical summary retrieved');
    } catch (err) {
      next(err);
    }
  };
}

export const codingController = new CodingController();
