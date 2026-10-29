import { Request, Response, NextFunction } from 'express';
import { interviewSessionService } from '../services/interviewSession.service';
import { sendSuccess, sendCreated } from '../utils/apiResponse';

export class InterviewController {
  /**
   * POST /api/interviews
   * Starts a new interactive interview session.
   */
  public async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const session = await interviewSessionService.createSession(userId, req.body);
      sendCreated(res, session, 'Interview session started successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/interviews/current
   * Retrieves active in-progress session for recovery.
   */
  public async getCurrentSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const session = await interviewSessionService.getCurrentSession(userId);
      sendSuccess(res, session, 'Current interview session retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/interviews/stats
   * Retrieves aggregate interview practice stats and progress across completed sessions.
   */
  public async getSessionStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const stats = await interviewSessionService.getSessionStats(userId);
      sendSuccess(res, stats, 'Interview statistics retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/interviews
   * Lists all interview sessions for current student.
   */
  public async getStudentSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const sessions = await interviewSessionService.getStudentSessions(userId);
      sendSuccess(res, sessions, 'Interview sessions retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/interviews/:id
   * Retrieves specific session by ID.
   */
  public async getSessionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const session = await interviewSessionService.getSessionById(req.params.id, userId);
      sendSuccess(res, session, 'Interview session retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/interviews/:id/answers
   * Submits student answer and receives immediate criteria-based evaluation.
   */
  public async submitAnswer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { questionIndex, studentAnswer } = req.body;
      const updatedSession = await interviewSessionService.submitAnswer(
        req.params.id,
        userId,
        questionIndex,
        studentAnswer
      );
      sendSuccess(res, updatedSession, 'Answer evaluated and recorded successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/interviews/:id/abandon
   * Abandons an in-progress session.
   */
  public async abandonSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const session = await interviewSessionService.abandonSession(req.params.id, userId);
      sendSuccess(res, session, 'Interview session abandoned successfully');
    } catch (err) {
      next(err);
    }
  }
}

export const interviewController = new InterviewController();

