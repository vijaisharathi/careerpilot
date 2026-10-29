import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/appError';

export class DashboardController {
  public async getDashboardSummary(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      const summary = await dashboardService.getDashboardSummary(userId);
      sendSuccess(res, summary, 'Dashboard summary metrics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();

