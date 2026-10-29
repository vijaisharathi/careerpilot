import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import {
  GetNotificationsQuery,
  UpdateNotificationPreferencesBody,
} from '../validations/notification.validation';

export class NotificationController {
  public async getNotifications(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      const query = req.query as unknown as GetNotificationsQuery;
      const notifications = await notificationService.getNotifications(userId, query);

      sendSuccess(res, notifications, 'Notifications retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async getUnreadCount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      const count = await notificationService.getUnreadCount(userId);
      sendSuccess(res, { unreadCount: count }, 'Unread count retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async markAsRead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      const { id } = req.params;
      const updated = await notificationService.markAsRead(userId, id);

      sendSuccess(res, updated, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }

  public async markAllAsRead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      const modifiedCount = await notificationService.markAllAsRead(userId);
      sendSuccess(res, { modifiedCount }, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  }

  public async dismissNotification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      const { id } = req.params;
      await notificationService.dismissNotification(userId, id);

      sendSuccess(res, null, 'Notification dismissed successfully');
    } catch (error) {
      next(error);
    }
  }

  public async getPreferences(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      const prefs = await notificationService.getPreferences(userId);
      sendSuccess(res, prefs, 'Notification preferences retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async updatePreferences(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      const body = req.body as UpdateNotificationPreferencesBody;
      const updated = await notificationService.updatePreferences(userId, body);

      sendSuccess(res, updated, 'Notification preferences updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public async syncReminders(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      const result = await notificationService.syncReminders(userId);
      sendSuccess(res, result, 'In-app reminders synchronized successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();

