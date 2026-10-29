import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { verifyAccessToken, JwtUserPayload } from '../utils/jwt';
import { User } from '../models/user.model';
import { getMongoConnectionState } from '../config/database';

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
    }
  }
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(AppError.unauthorized('No authentication token provided'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);

    // If database is connected, verify user still exists and account is not suspended
    if (getMongoConnectionState() === 'connected') {
      const user = await User.findById(decoded.userId).select('_id email role status');
      if (!user) {
        return next(AppError.unauthorized('User account no longer exists'));
      }
      if (user.status === 'suspended') {
        return next(AppError.forbidden('Your account has been suspended. Please contact platform administrators.'));
      }
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError('Invalid or expired authentication token', 401));
  }
};

/**
 * Optional authentication:
 * Sets req.user if a valid Bearer token is provided, but continues cleanly without failing if absent.
 */
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
  } catch {
    // Ignore invalid token on optional auth routes
  }
  next();
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden(`Requires one of the following roles: ${allowedRoles.join(', ')}`));
    }

    next();
  };
};
