import { Request, Response, NextFunction } from 'express';
import { careerAnalysisService } from '../services/careerAnalysis.service';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/appError';

export const getRoles = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const roles = await careerAnalysisService.getRoles();
    sendSuccess(res, { roles }, 'Career roles catalog retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const getRoleBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const role = await careerAnalysisService.getRoleBySlug(req.params.slug);
    sendSuccess(res, { role }, 'Career role details retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const runAnalysis = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());

    const { roleSlug } = req.body || {};
    const analysis = await careerAnalysisService.runAnalysis(req.user.userId, roleSlug);
    sendSuccess(res, { analysis }, 'Career and skill-gap analysis completed successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getLatestAnalysis = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());

    const analysis = await careerAnalysisService.getLatestAnalysis(req.user.userId);
    sendSuccess(res, { analysis }, 'Latest career analysis retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const getAnalysisHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());

    const history = await careerAnalysisService.getAnalysisHistory(req.user.userId);
    sendSuccess(res, { history }, 'Career analysis history retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const getAnalysisById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());

    const analysis = await careerAnalysisService.getAnalysisById(req.user.userId, req.params.id);
    sendSuccess(res, { analysis }, 'Career analysis details retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

