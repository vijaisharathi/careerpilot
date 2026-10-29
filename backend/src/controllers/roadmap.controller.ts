import { Request, Response, NextFunction } from 'express';
import { roadmapService } from '../services/roadmap.service';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import {
  GenerateRoadmapInput,
  UpdateTaskStatusInput,
  UpdateScheduleInput,
  RegenerateRoadmapInput,
} from '../validations/roadmap.validation';

export const getRoadmap = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());
    const userId = req.user.userId;
    const roadmap = await roadmapService.getActiveRoadmap(userId);

    sendSuccess(res, roadmap, roadmap ? 'Active roadmap retrieved successfully' : 'No active roadmap found');
  } catch (error) {
    next(error);
  }
};

export const generateRoadmap = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());
    const userId = req.user.userId;
    const input: GenerateRoadmapInput = req.body;
    const roadmap = await roadmapService.generateRoadmap(userId, input);

    sendSuccess(res, roadmap, 'Personalized learning roadmap generated successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());
    const userId = req.user.userId;
    const { taskId } = req.params;
    const { completed }: UpdateTaskStatusInput = req.body;

    const updatedRoadmap = await roadmapService.toggleTaskCompletion(userId, taskId, completed);

    sendSuccess(res, updatedRoadmap, `Task marked as ${completed ? 'completed' : 'pending'}`);
  } catch (error) {
    next(error);
  }
};

export const updateSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());
    const userId = req.user.userId;
    const input: UpdateScheduleInput = req.body;

    const updatedRoadmap = await roadmapService.updateSchedule(userId, input);

    sendSuccess(res, updatedRoadmap, 'Roadmap study schedule updated successfully');
  } catch (error) {
    next(error);
  }
};

export const regenerateRoadmap = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());
    const userId = req.user.userId;
    const input: RegenerateRoadmapInput = req.body;

    const newRoadmap = await roadmapService.regenerateRoadmap(userId, input);

    sendSuccess(res, newRoadmap, 'Learning roadmap successfully regenerated with progress preserved', 201);
  } catch (error) {
    next(error);
  }
};
