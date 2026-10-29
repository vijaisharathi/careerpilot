import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/appError';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const meta = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.socket.remoteAddress,
    };
    const result = await authService.register(req.body, meta);
    sendSuccess(res, result, 'Student account registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const meta = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.socket.remoteAddress,
    };
    const result = await authService.login(req.body, meta);
    sendSuccess(res, result, 'Signed in successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const meta = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.socket.remoteAddress,
    };
    const { refreshToken } = req.body;
    const tokens = await authService.refreshToken(refreshToken, meta);
    sendSuccess(res, { tokens }, 'Tokens refreshed successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.userId) {
      return next(AppError.unauthorized());
    }

    const { refreshToken } = req.body || {};
    await authService.logout(req.user.userId, refreshToken);
    sendSuccess(res, null, 'Signed out successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.userId) {
      return next(AppError.unauthorized());
    }

    const { user, profile } = await authService.getProfile(req.user.userId);
    sendSuccess(res, { user, profile }, 'User details retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};
