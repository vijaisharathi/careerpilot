import { Router } from 'express';
import { jobApplicationController } from '../controllers/jobApplication.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  createApplicationSchema,
  updateApplicationSchema,
  queryApplicationsSchema,
  applicationIdSchema,
} from '../validations/jobApplication.validation';

const router = Router();

// All application routes require authentication
router.use(authenticate);

// Aggregated summary stats (MUST precede /:id)
router.get('/stats', (req, res, next) =>
  jobApplicationController.getApplicationStats(req, res, next)
);

// List and create applications
router.get(
  '/',
  validateRequest(queryApplicationsSchema),
  (req, res, next) => jobApplicationController.getApplications(req, res, next)
);

router.post(
  '/',
  validateRequest(createApplicationSchema),
  (req, res, next) => jobApplicationController.createApplication(req, res, next)
);

// Individual application operations
router.get(
  '/:id',
  validateRequest(applicationIdSchema),
  (req, res, next) => jobApplicationController.getApplicationById(req, res, next)
);

router.put(
  '/:id',
  validateRequest(updateApplicationSchema),
  (req, res, next) => jobApplicationController.updateApplication(req, res, next)
);

router.patch(
  '/:id',
  validateRequest(updateApplicationSchema),
  (req, res, next) => jobApplicationController.updateApplication(req, res, next)
);

router.delete(
  '/:id',
  validateRequest(applicationIdSchema),
  (req, res, next) => jobApplicationController.deleteApplication(req, res, next)
);

export default router;

