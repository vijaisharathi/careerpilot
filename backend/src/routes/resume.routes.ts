import { Router } from 'express';
import { resumeController } from '../controllers/resume.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { resumeUpload } from '../middleware/upload.middleware';
import {
  createResumeSchema,
  updateResumeSchema,
  populateFromProfileSchema,
  createVariantSchema,
  applyBulletSchema,
} from '../validations/resume.validation';

const router = Router();

// All resume operations require authentication
router.use(authenticate);

// List and create resumes
router.get('/', (req, res, next) => resumeController.getResumes(req, res, next));
router.post(
  '/',
  validateRequest(createResumeSchema),
  (req, res, next) => resumeController.createResume(req, res, next)
);

// Populate draft directly from student profile
router.post(
  '/import-profile',
  validateRequest(populateFromProfileSchema),
  (req, res, next) => resumeController.populateFromProfile(req, res, next)
);

// Analysis routes (must be mounted before /:id)
router.get('/analyses', (req, res, next) => resumeController.getAnalysisHistory(req, res, next));
router.get('/analyses/:id', (req, res, next) => resumeController.getAnalysisById(req, res, next));
router.post(
  '/analyze',
  resumeUpload.single('file'),
  (req, res, next) => resumeController.analyzeResume(req, res, next)
);

// Single resume operations
router.get('/:id', (req, res, next) => resumeController.getResumeById(req, res, next));
router.put(
  '/:id',
  validateRequest(updateResumeSchema),
  (req, res, next) => resumeController.updateResume(req, res, next)
);
router.delete('/:id', (req, res, next) => resumeController.deleteResume(req, res, next));

// Versioning and Variants
router.post('/:id/versions', (req, res, next) => resumeController.createVersion(req, res, next));
router.post(
  '/:id/variants',
  validateRequest(createVariantSchema),
  (req, res, next) => resumeController.createVariant(req, res, next)
);

// PDF Export
router.get('/:id/export/pdf', (req, res, next) => resumeController.exportPdf(req, res, next));

// Apply bullet improvement
router.post(
  '/:id/apply-bullet',
  validateRequest(applyBulletSchema),
  (req, res, next) => resumeController.applyBulletImprovement(req, res, next)
);

export default router;
