import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  updateStudentStatusSchema,
  provisionAdminSchema,
  adminJobQuerySchema,
  createAdminJobSchema,
  createAdminRoleSchema,
  createLearningResourceSchema,
  updatePlatformSettingsSchema,
} from '../validations/admin.validation';

const router = Router();

// Strict RBAC: All administrative routes require valid JWT and role === 'admin'
router.use(authenticate);
router.use(requireRole(['admin']));

// 1. Overview
router.get('/overview', (req, res, next) => adminController.getOverview(req, res, next));

// 2. Student Management
router.get('/students', (req, res, next) => adminController.getStudents(req, res, next));
router.get('/students/:id', (req, res, next) => adminController.getStudentDetail(req, res, next));
router.patch(
  '/students/:id/status',
  validateRequest(updateStudentStatusSchema),
  (req, res, next) => adminController.updateStudentStatus(req, res, next)
);
router.post(
  '/users/provision-admin',
  validateRequest(provisionAdminSchema),
  (req, res, next) => adminController.provisionAdmin(req, res, next)
);

// 3. Job & Internship Management
router.get(
  '/jobs',
  validateRequest(adminJobQuerySchema),
  (req, res, next) => adminController.getJobs(req, res, next)
);
router.post(
  '/jobs',
  validateRequest(createAdminJobSchema),
  (req, res, next) => adminController.createJob(req, res, next)
);
router.get('/jobs/:id', (req, res, next) => adminController.getJobDetail(req, res, next));
router.put('/jobs/:id', (req, res, next) => adminController.updateJob(req, res, next));
router.patch('/jobs/:id', (req, res, next) => adminController.updateJob(req, res, next));
router.patch('/jobs/:id/status', (req, res, next) => adminController.updateJobStatus(req, res, next));
router.delete('/jobs/:id', (req, res, next) => adminController.deleteJob(req, res, next));

// 4. Career Role Catalog Management
router.get('/career-roles', (req, res, next) => adminController.getCareerRoles(req, res, next));
router.post(
  '/career-roles',
  validateRequest(createAdminRoleSchema),
  (req, res, next) => adminController.createCareerRole(req, res, next)
);
router.put('/career-roles/:idOrSlug', (req, res, next) => adminController.updateCareerRole(req, res, next));
router.patch('/career-roles/:idOrSlug/status', (req, res, next) =>
  adminController.toggleCareerRoleStatus(req, res, next)
);

// 5. Learning Resources Management
router.get('/learning-resources', (req, res, next) => adminController.getLearningResources(req, res, next));
router.post(
  '/learning-resources',
  validateRequest(createLearningResourceSchema),
  (req, res, next) => adminController.createLearningResource(req, res, next)
);
router.put('/learning-resources/:id', (req, res, next) =>
  adminController.updateLearningResource(req, res, next)
);
router.delete('/learning-resources/:id', (req, res, next) =>
  adminController.deleteLearningResource(req, res, next)
);

// 6. AI Service Monitoring
router.get('/ai/status', (req, res, next) => adminController.getAiMonitoring(req, res, next));

// 7. Platform Activity & Audit Logs
router.get('/audit-logs', (req, res, next) => adminController.getAuditLogs(req, res, next));

// 8. Platform Settings
router.get('/settings', (req, res, next) => adminController.getSettings(req, res, next));
router.put(
  '/settings',
  validateRequest(updatePlatformSettingsSchema),
  (req, res, next) => adminController.updateSettings(req, res, next)
);

export default router;

