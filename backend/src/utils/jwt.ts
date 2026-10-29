import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { AppError } from './appError';

export interface JwtUserPayload {
  userId: string;
  email: string;
  role: string;
  institutionId?: string;
  tokenType?: 'access';
}

export interface JwtRefreshPayload {
  userId: string;
  tokenId: string;
  tokenType: 'refresh';
}

export const signAccessToken = (
  payload: Omit<JwtUserPayload, 'tokenType'>,
  expiresIn: string = env.JWT_EXPIRES_IN
): string => {
  return jwt.sign(
    { ...payload, tokenType: 'access' },
    env.JWT_SECRET,
    { expiresIn: expiresIn as unknown as number }
  );
};

export const signToken = signAccessToken;

export const signRefreshToken = (
  userId: string,
  tokenId: string = crypto.randomUUID(),
  expiresIn: string = env.JWT_REFRESH_EXPIRES_IN
): { refreshToken: string; tokenId: string } => {
  const refreshToken = jwt.sign(
    { userId, tokenId, tokenType: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: expiresIn as unknown as number }
  );
  return { refreshToken, tokenId };
};

export const verifyAccessToken = (token: string): JwtUserPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtUserPayload;
    if (decoded.tokenType && decoded.tokenType !== 'access') {
      throw AppError.unauthorized('Invalid token type');
    }
    return decoded;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Access token has expired', 401, undefined);
    }
    throw new AppError('Invalid authentication token', 401, undefined);
  }
};

export const verifyToken = verifyAccessToken;

export const verifyRefreshToken = (token: string): JwtRefreshPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtRefreshPayload;
    if (decoded.tokenType !== 'refresh') {
      throw AppError.unauthorized('Invalid refresh token type');
    }
    return decoded;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Refresh token has expired. Please sign in again.', 401, undefined);
    }
    throw new AppError('Invalid refresh token', 401, undefined);
  }
};

/**
 * Creates SHA-256 hash of a token for safe database persistence and verification.
 * Plaintext refresh tokens are never stored in the database.
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
