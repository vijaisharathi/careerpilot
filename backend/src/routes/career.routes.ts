import { Router } from 'express';
import { careerController } from '../controllers';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { runAnalysisSchema } from '../validations/career.validation';

const router = Router();

// Catalog roles (available for exploration)
router.get('/roles', careerController.getRoles);
router.get('/roles/:slug', careerController.getRoleBySlug);

// Authenticated student career analyses
router.use(authenticate);

router.post('/analyze', validateRequest(runAnalysisSchema), careerController.runAnalysis);
router.get('/analysis/latest', careerController.getLatestAnalysis);
router.get('/analysis/history', careerController.getAnalysisHistory);
router.get('/analyses', careerController.getAnalysisHistory);
router.get('/analysis/:id', careerController.getAnalysisById);

export default router;

