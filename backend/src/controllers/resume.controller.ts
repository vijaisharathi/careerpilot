import { Request, Response, NextFunction } from 'express';
import { resumeService } from '../services/resume.service';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { AppError } from '../utils/appError';

export class ResumeController {
  /**
   * GET /api/resumes
   * Get all resumes for current student
   */
  public async getResumes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const resumes = await resumeService.getResumes(userId);
      sendSuccess(res, resumes, 'Resumes retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/resumes/:id
   * Get specific resume by ID
   */
  public async getResumeById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const resume = await resumeService.getResumeById(req.params.id, userId);
      sendSuccess(res, resume, 'Resume retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/resumes
   * Create a new blank or custom resume
   */
  public async createResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const resume = await resumeService.createResume(userId, req.body);
      sendCreated(res, resume, 'Resume created successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/resumes/import-profile
   * Pre-fill and create a resume from the student's saved profile
   */
  public async populateFromProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const resume = await resumeService.populateFromProfile(userId, req.body);
      sendCreated(res, resume, 'Resume generated from student profile successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/resumes/:id
   * Update an existing resume
   */
  public async updateResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const resume = await resumeService.updateResume(req.params.id, userId, req.body);
      sendSuccess(res, resume, 'Resume updated successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/resumes/:id/versions
   * Create a new version snapshot of a resume
   */
  public async createVersion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const versionDoc = await resumeService.createResumeVersion(req.params.id, userId);
      sendCreated(res, versionDoc, 'New resume version created successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/resumes/:id/variants
   * Create a tailored job-specific resume variant
   */
  public async createVariant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { targetRole, jobId } = req.body;
      const variantDoc = await resumeService.createResumeVariant(
        req.params.id,
        userId,
        targetRole,
        jobId
      );
      sendCreated(res, variantDoc, 'Job-specific resume variant created successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/resumes/:id
   * Delete a resume
   */
  public async deleteResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      await resumeService.deleteResume(req.params.id, userId);
      sendSuccess(res, null, 'Resume deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/resumes/:id/export/pdf
   * Generate and download PDF format resume
   */
  public async exportPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const buffer = await resumeService.exportResumePdf(req.params.id, userId);
      const resume = await resumeService.getResumeById(req.params.id, userId);

      const safeName = (resume.personalInfo.fullName || 'Resume')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .slice(0, 40);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}_Resume.pdf"`);
      res.setHeader('Content-Length', buffer.length);
      res.end(buffer);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/resumes/analyze
   * Perform criteria-based ATS & keyword analysis on uploaded file or existing resume
   */
  public async analyzeResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const file = req.file;

      const targetJobDescription = req.body.targetJobDescription;
      const targetJobTitle = req.body.targetJobTitle;
      const jobId = req.body.jobId;
      const resumeId = req.body.resumeId;

      if (!targetJobDescription) {
        throw new AppError('Target job description is required for ATS analysis.', 400);
      }

      const analysis = await resumeService.analyzeResume(userId, {
        resumeId,
        fileBuffer: file?.buffer,
        originalFileName: file?.originalname,
        mimeType: file?.mimetype,
        targetJobTitle,
        targetJobDescription,
        jobId,
      });

      sendSuccess(res, analysis, 'Resume analyzed successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/resumes/analyses
   * Get previous analysis reports
   */
  public async getAnalysisHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const history = await resumeService.getAnalysisHistory(userId);
      sendSuccess(res, history, 'Analysis history retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/resumes/analyses/:id
   * Get a specific analysis report
   */
  public async getAnalysisById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const analysis = await resumeService.getAnalysisById(req.params.id, userId);
      sendSuccess(res, analysis, 'Analysis report retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/resumes/:id/apply-bullet
   * Accept and apply an AI/criteria-suggested bullet improvement directly into the resume
   */
  public async applyBulletImprovement(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { original, suggested } = req.body;
      const updated = await resumeService.applyBulletImprovement(
        req.params.id,
        userId,
        original,
        suggested
      );
      sendSuccess(res, updated, 'Bullet improvement applied to resume successfully');
    } catch (err) {
      next(err);
    }
  }
}

export const resumeController = new ResumeController();

