import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Dashboard summary analytics endpoint requires authentication
router.use(authenticate);

router.get('/summary', (req, res, next) =>
  dashboardController.getDashboardSummary(req, res, next)
);

export default router;

