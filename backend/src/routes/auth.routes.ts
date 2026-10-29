import { Router } from 'express';
import { authController } from '../controllers';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rateLimit.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
} from '../validations/auth.validation';

const router = Router();

router.post(
  '/register',
  authRateLimiter,
  validateRequest(registerSchema),
  authController.register
);

router.post(
  '/login',
  authRateLimiter,
  validateRequest(loginSchema),
  authController.login
);

router.post(
  '/refresh-token',
  authRateLimiter,
  validateRequest(refreshTokenSchema),
  authController.refreshToken
);

router.post(
  '/logout',
  authenticate,
  validateRequest(logoutSchema),
  authController.logout
);

router.get('/me', authenticate, authController.getMe);

export default router;
