import { Router } from 'express';
import * as jobController from '../controllers/job.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  searchJobsSchema,
  saveJobSchema,
  getJobByIdSchema,
} from '../validations/job.validation';

const router = Router();

// Public / Optionally Authenticated routes
router.get('/', optionalAuthenticate, validateRequest(searchJobsSchema), jobController.searchJobs);

// Saved jobs list (requires authentication)
router.get('/saved', authenticate, jobController.getSavedJobs);

// Specific opportunity details (optional auth for personalized match & eligibility)
router.get('/:idOrSlug', optionalAuthenticate, validateRequest(getJobByIdSchema), jobController.getJobByIdOrSlug);

// AI insights for opportunity (requires authentication)
router.get('/:id/ai-insights', authenticate, jobController.getAiInsights);

// Save / Unsave actions (requires authentication)
router.post('/:id/save', authenticate, validateRequest(saveJobSchema), jobController.saveJob);
router.delete('/:id/save', authenticate, jobController.unsaveJob);

// Admin / Utility seed endpoint
router.post('/seed', jobController.seedJobs);

export default router;

