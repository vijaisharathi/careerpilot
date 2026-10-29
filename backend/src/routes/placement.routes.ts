import { Router } from 'express';
import { placementController } from '../controllers/placement.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  createDriveSchema,
  updateDriveSchema,
  changeDriveStatusSchema,
  updateCandidateStageSchema,
  overrideEligibilitySchema,
  createAnnouncementSchema,
  provisionPlacementOfficerSchema,
} from '../validations/placement.validation';

const router = Router();

// ==========================================
// STUDENT CAMPUS PLACEMENT ROUTES
// Requires: authenticated student
// ==========================================

router.get(
  '/student/drives',
  authenticate,
  requireRole(['student', 'admin']),
  (req, res, next) => placementController.getStudentCampusDrives(req, res, next)
);

router.post(
  '/student/drives/:id/register',
  authenticate,
  requireRole(['student', 'admin']),
  (req, res, next) => placementController.registerForCampusDrive(req, res, next)
);

router.get(
  '/student/registrations',
  authenticate,
  requireRole(['student', 'admin']),
  (req, res, next) => placementController.getStudentRegistrations(req, res, next)
);

router.get(
  '/student/announcements',
  authenticate,
  requireRole(['student', 'admin']),
  (req, res, next) => placementController.getStudentAnnouncements(req, res, next)
);

// ==========================================
// ADMIN-ONLY PROVISIONING ROUTE
// Requires: authenticated admin
// ==========================================

router.post(
  '/provision-officer',
  authenticate,
  requireRole(['admin']),
  validateRequest(provisionPlacementOfficerSchema),
  (req, res, next) => placementController.provisionPlacementOfficer(req, res, next)
);

// ==========================================
// PLACEMENT OFFICER & ADMIN ROUTES
// Requires: authenticated placement_officer or admin
// ==========================================

const officerAuth = [authenticate, requireRole(['placement_officer', 'admin'])];

// 1. Dashboard Metrics
router.get('/dashboard/metrics', ...officerAuth, (req, res, next) =>
  placementController.getDashboardMetrics(req, res, next)
);

// 2. Student Directory & Scoped Dossier
router.get('/students', ...officerAuth, (req, res, next) =>
  placementController.getStudentDirectory(req, res, next)
);

router.get('/students/:id', ...officerAuth, (req, res, next) =>
  placementController.getStudentPlacementDetail(req, res, next)
);

// 3. Recruitment Drives CRUD & Status Transitions
router.get('/drives', ...officerAuth, (req, res, next) =>
  placementController.getRecruitmentDrives(req, res, next)
);

router.post(
  '/drives',
  ...officerAuth,
  validateRequest(createDriveSchema),
  (req, res, next) => placementController.createRecruitmentDrive(req, res, next)
);

router.get('/drives/:id', ...officerAuth, (req, res, next) =>
  placementController.getRecruitmentDriveDetail(req, res, next)
);

router.put(
  '/drives/:id',
  ...officerAuth,
  validateRequest(updateDriveSchema),
  (req, res, next) => placementController.updateRecruitmentDrive(req, res, next)
);

router.patch(
  '/drives/:id/status',
  ...officerAuth,
  validateRequest(changeDriveStatusSchema),
  (req, res, next) => placementController.changeDriveStatus(req, res, next)
);

// 4. Candidate Registrations & Stage Tracking
router.get('/drives/:id/candidates', ...officerAuth, (req, res, next) =>
  placementController.getDriveCandidates(req, res, next)
);

router.patch(
  '/drives/:id/candidates/:registrationId/stage',
  ...officerAuth,
  validateRequest(updateCandidateStageSchema),
  (req, res, next) => placementController.updateCandidateStage(req, res, next)
);

router.post(
  '/drives/:id/candidates/:registrationId/override-eligibility',
  ...officerAuth,
  validateRequest(overrideEligibilitySchema),
  (req, res, next) => placementController.overrideCandidateEligibility(req, res, next)
);

// 5. Analytics & Safe CSV Export
router.get('/analytics', ...officerAuth, (req, res, next) =>
  placementController.getPlacementAnalytics(req, res, next)
);

router.get('/reports/export', ...officerAuth, (req, res, next) =>
  placementController.exportPlacementDataCsv(req, res, next)
);

// 6. Announcements
router.get('/announcements', ...officerAuth, (req, res, next) =>
  placementController.getAnnouncements(req, res, next)
);

router.post(
  '/announcements',
  ...officerAuth,
  validateRequest(createAnnouncementSchema),
  (req, res, next) => placementController.createAnnouncement(req, res, next)
);

export default router;

