import { Router } from 'express';
import * as roadmapController from '../controllers/roadmap.controller';
import { authenticate } from '../middleware/auth.middleware';

import { validateRequest } from '../middleware/validate.middleware';
import {
  generateRoadmapSchema,
  updateTaskStatusSchema,
  updateScheduleSchema,
  regenerateRoadmapSchema,
} from '../validations/roadmap.validation';

const router = Router();

// All roadmap operations require an authenticated student session
router.use(authenticate);

router.get('/', roadmapController.getRoadmap);
router.post('/generate', validateRequest(generateRoadmapSchema), roadmapController.generateRoadmap);
router.patch('/tasks/:taskId', validateRequest(updateTaskStatusSchema), roadmapController.updateTaskStatus);
router.patch('/schedule', validateRequest(updateScheduleSchema), roadmapController.updateSchedule);
router.post('/regenerate', validateRequest(regenerateRoadmapSchema), roadmapController.regenerateRoadmap);

export default router;
