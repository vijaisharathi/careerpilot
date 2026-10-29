import { Router } from 'express';
import { interviewController } from '../controllers/interview.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  createInterviewSessionSchema,
  submitAnswerSchema,
  getSessionByIdSchema,
} from '../validations/interview.validation';

const router = Router();

// All interview operations require authentication
router.use(authenticate);

// List and create interview sessions
router.get('/', (req, res, next) => interviewController.getStudentSessions(req, res, next));
router.post(
  '/',
  validateRequest(createInterviewSessionSchema),
  (req, res, next) => interviewController.createSession(req, res, next)
);

// Recovery and Aggregate Statistics (must precede /:id)
router.get('/current', (req, res, next) =>
  interviewController.getCurrentSession(req, res, next)
);
router.get('/stats', (req, res, next) =>
  interviewController.getSessionStats(req, res, next)
);

// Specific session operations
router.get(
  '/:id',
  validateRequest(getSessionByIdSchema),
  (req, res, next) => interviewController.getSessionById(req, res, next)
);
router.post(
  '/:id/answers',
  validateRequest(submitAnswerSchema),
  (req, res, next) => interviewController.submitAnswer(req, res, next)
);
router.post(
  '/:id/abandon',
  validateRequest(getSessionByIdSchema),
  (req, res, next) => interviewController.abandonSession(req, res, next)
);

export default router;

