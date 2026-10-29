import { Router } from 'express';
import { codingController } from '../controllers/coding.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  codeExecutionRateLimiter,
  aiRateLimiter,
} from '../middleware/rateLimit.middleware';
import {
  createQuestionSchema,
  updateQuestionSchema,
  createAssessmentSchema,
  runSampleCodeSchema,
  submitSolutionSchema,
  startAttemptSchema,
} from '../validations/coding.validation';

const router = Router();

// Base Auth Guard for all coding endpoints
router.use(authenticate);

// --- Public/Student Question & Assessment Catalog ---
router.get('/questions', (req, res, next) => codingController.getQuestions(req, res, next));
router.get('/questions/:idOrSlug', (req, res, next) =>
  codingController.getQuestionDetail(req, res, next)
);

router.get('/assessments', (req, res, next) => codingController.getAssessments(req, res, next));
router.get('/assessments/:idOrSlug', (req, res, next) =>
  codingController.getAssessmentDetail(req, res, next)
);

// --- Assessment Session Attempts ---
router.post(
  '/attempts',
  validateRequest(startAttemptSchema),
  (req, res, next) => codingController.startAttempt(req, res, next)
);
router.get('/attempts/:attemptId', (req, res, next) =>
  codingController.getAttempt(req, res, next)
);
router.post('/attempts/:attemptId/finish', (req, res, next) =>
  codingController.finishAttempt(req, res, next)
);

// --- Code Execution & Evaluation ---
router.post(
  '/run-sample',
  codeExecutionRateLimiter,
  validateRequest(runSampleCodeSchema),
  (req, res, next) => codingController.runSampleCode(req, res, next)
);

router.post(
  '/submit',
  codeExecutionRateLimiter,
  validateRequest(submitSolutionSchema),
  (req, res, next) => codingController.submitSolution(req, res, next)
);

router.post(
  '/submissions/:submissionId/ai-feedback',
  aiRateLimiter,
  (req, res, next) => codingController.requestAiFeedback(req, res, next)
);

// --- Student Submission History & Technical Profile ---
router.get('/submissions', (req, res, next) => codingController.getSubmissions(req, res, next));
router.get('/submissions/:submissionId', (req, res, next) =>
  codingController.getSubmissionDetail(req, res, next)
);
router.get('/skill-profile', (req, res, next) =>
  codingController.getStudentSkillSummary(req, res, next)
);
router.get('/engine/status', (req, res) => codingController.getExecutionEngineStatus(req, res));

// --- Placement Officer Endpoints ---
router.get(
  '/placement/analytics',
  requireRole(['placement_officer', 'admin']),
  (req, res, next) => codingController.getPlacementCodingAnalytics(req, res, next)
);
router.get(
  '/placement/candidates/:studentId/summary',
  requireRole(['placement_officer', 'admin']),
  (req, res, next) => codingController.getCandidateTechnicalSummary(req, res, next)
);

// --- Admin Management Endpoints ---
router.post(
  '/admin/questions',
  requireRole(['admin']),
  validateRequest(createQuestionSchema),
  (req, res, next) => codingController.createQuestion(req, res, next)
);
router.put(
  '/admin/questions/:id',
  requireRole(['admin']),
  validateRequest(updateQuestionSchema),
  (req, res, next) => codingController.updateQuestion(req, res, next)
);
router.post(
  '/admin/assessments',
  requireRole(['admin']),
  validateRequest(createAssessmentSchema),
  (req, res, next) => codingController.createAssessment(req, res, next)
);

export default router;
