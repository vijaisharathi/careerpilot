import { Request, Response, NextFunction } from 'express';
import { jobApplicationService } from '../services/jobApplication.service';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import {
  CreateApplicationBody,
  UpdateApplicationBody,
  QueryApplicationsQuery,
} from '../validations/jobApplication.validation';

export class JobApplicationController {
  public async createApplication(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      const body = req.body as CreateApplicationBody;
      const application = await jobApplicationService.createApplication(userId, body);

      sendCreated(res, application, 'Application tracked successfully');
    } catch (error) {
      next(error);
    }
  }

  public async getApplications(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      const query = req.query as unknown as QueryApplicationsQuery;
      const applications = await jobApplicationService.getApplications(userId, query);

      sendSuccess(res, applications, 'Applications retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async getApplicationStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      const stats = await jobApplicationService.getApplicationStats(userId);

      sendSuccess(res, stats, 'Application statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async getApplicationById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      const { id } = req.params;
      const application = await jobApplicationService.getApplicationById(id, userId);

      sendSuccess(res, application, 'Application retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async updateApplication(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      const { id } = req.params;
      const body = req.body as UpdateApplicationBody;
      const updated = await jobApplicationService.updateApplication(id, userId, body);

      sendSuccess(res, updated, 'Application updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public async deleteApplication(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      const { id } = req.params;
      await jobApplicationService.deleteApplication(id, userId);

      sendSuccess(res, null, 'Application removed successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const jobApplicationController = new JobApplicationController();

