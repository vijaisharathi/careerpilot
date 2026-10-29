import { Request, Response, NextFunction } from 'express';
import { jobDiscoveryService } from '../services/jobDiscovery.service';
import { jobAiService } from '../services/jobAi.service';
import { jobMatchingService } from '../services/jobMatching.service';
import { jobSourceManager, LocalSeedJobProvider } from '../services/jobs/jobSource.service';
import { StudentProfile } from '../models/studentProfile.model';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import { SearchJobsQuery, SaveJobBody } from '../validations/job.validation';
import { Types } from 'mongoose';

export const searchJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = req.query as unknown as SearchJobsQuery;
    const userId = req.user?.userId;

    const result = await jobDiscoveryService.searchOpportunities({
      ...query,
      userId,
    });

    sendSuccess(res, result, 'Opportunities retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const getJobByIdOrSlug = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { idOrSlug } = req.params;
    const userId = req.user?.userId;

    const job = await jobDiscoveryService.getOpportunityByIdOrSlug(idOrSlug, userId);

    sendSuccess(res, { job }, 'Opportunity details retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const getAiInsights = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());
    const userId = req.user.userId;
    const { id } = req.params;

    const job = await jobDiscoveryService.getOpportunityByIdOrSlug(id, userId);
    const profile = await StudentProfile.findOne({ user: new Types.ObjectId(userId) });
    if (!profile) {
      throw new AppError('Student profile not found. Please complete your profile first.', 404);
    }

    const match = job.match || jobMatchingService.evaluateMatch(job as any, profile);
    const insights = await jobAiService.generateInsights(job as any, profile, match);

    sendSuccess(res, { insights }, 'AI opportunity insights generated successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const getSavedJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());
    const userId = req.user.userId;

    const savedJobs = await jobDiscoveryService.getSavedJobs(userId);

    sendSuccess(res, { savedJobs }, 'Saved opportunities retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const saveJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());
    const userId = req.user.userId;
    const { id } = req.params;
    const { notes } = (req.body || {}) as SaveJobBody;

    const saved = await jobDiscoveryService.saveJob(userId, id, notes);

    sendSuccess(res, { saved }, 'Opportunity saved to your profile', 201);
  } catch (error) {
    next(error);
  }
};

export const unsaveJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());
    const userId = req.user.userId;
    const { id } = req.params;

    await jobDiscoveryService.unsaveJob(userId, id);

    sendSuccess(res, { unsaved: true }, 'Opportunity removed from saved list', 200);
  } catch (error) {
    next(error);
  }
};

export const seedJobs = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const syncedCount = await jobSourceManager.syncFromProvider(new LocalSeedJobProvider());
    sendSuccess(res, { syncedCount }, `Successfully seeded ${syncedCount} opportunities`, 200);
  } catch (error) {
    next(error);
  }
};

