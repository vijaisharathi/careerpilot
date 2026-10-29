import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  getNotificationsQuerySchema,
  notificationIdSchema,
  updateNotificationPreferencesSchema,
} from '../validations/notification.validation';

const router = Router();

// All notification operations require authentication
router.use(authenticate);

// Aggregated & Preference Endpoints (must precede /:id)
router.get('/unread-count', (req, res, next) =>
  notificationController.getUnreadCount(req, res, next)
);

router.post('/sync-reminders', (req, res, next) =>
  notificationController.syncReminders(req, res, next)
);

router.get('/preferences', (req, res, next) =>
  notificationController.getPreferences(req, res, next)
);

router.put(
  '/preferences',
  validateRequest(updateNotificationPreferencesSchema),
  (req, res, next) => notificationController.updatePreferences(req, res, next)
);

router.patch('/mark-all-read', (req, res, next) =>
  notificationController.markAllAsRead(req, res, next)
);

// List notifications
router.get(
  '/',
  validateRequest(getNotificationsQuerySchema),
  (req, res, next) => notificationController.getNotifications(req, res, next)
);

// Specific notification operations
router.patch(
  '/:id/read',
  validateRequest(notificationIdSchema),
  (req, res, next) => notificationController.markAsRead(req, res, next)
);

router.delete(
  '/:id',
  validateRequest(notificationIdSchema),
  (req, res, next) => notificationController.dismissNotification(req, res, next)
);

export default router;

