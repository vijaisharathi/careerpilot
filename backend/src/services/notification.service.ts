import { Types } from 'mongoose';
import {
  Notification,
  INotification,
  NotificationType,
} from '../models/notification.model';
import {
  NotificationPreference,
  INotificationPreference,
} from '../models/notificationPreference.model';
import { JobApplication, IJobApplication } from '../models/jobApplication.model';
import { LearningRoadmap } from '../models/learningRoadmap.model';
import { StudentProfile } from '../models/studentProfile.model';
import { AppError } from '../utils/appError';

export interface NotificationFilterOptions {
  status?: 'all' | 'unread';
  type?: NotificationType | 'all';
  limit?: number;
}

export interface UpdatePreferencesInput {
  interviewReminders?: boolean;
  followUpReminders?: boolean;
  learningMilestones?: boolean;
  roadmapTaskReminders?: boolean;
  timeZone?: string;
}

export class NotificationService {
  /**
   * Retrieves notifications for the student with optional filtering
   */
  public async getNotifications(
    userId: string,
    options: NotificationFilterOptions = {}
  ): Promise<INotification[]> {
    const userObjectId = new Types.ObjectId(userId);
    const query: Record<string, unknown> = {
      user: userObjectId,
      dismissed: false,
    };

    if (options.status === 'unread') {
      query.read = false;
    }

    if (options.type && options.type !== 'all') {
      query.type = options.type;
    }

    const limit = options.limit || 50;

    return Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean() as unknown as Promise<INotification[]>;
  }

  /**
   * Gets the count of unread notifications
   */
  public async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({
      user: new Types.ObjectId(userId),
      read: false,
      dismissed: false,
    });
  }

  /**
   * Marks a single notification as read with ownership check
   */
  public async markAsRead(userId: string, notificationId: string): Promise<INotification> {
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new AppError('Invalid notification ID format.', 400);
    }

    const notification = await Notification.findById(notificationId);
    if (!notification || notification.dismissed) {
      throw new AppError('Notification not found.', 404);
    }

    if (notification.user.toString() !== userId) {
      throw new AppError('You are not authorized to modify this notification.', 403);
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    return notification;
  }

  /**
   * Marks all notifications as read for the authenticated student
   */
  public async markAllAsRead(userId: string): Promise<number> {
    const res = await Notification.updateMany(
      {
        user: new Types.ObjectId(userId),
        read: false,
        dismissed: false,
      },
      {
        $set: { read: true, readAt: new Date() },
      }
    );

    return res.modifiedCount;
  }

  /**
   * Dismisses / deletes a notification
   */
  public async dismissNotification(userId: string, notificationId: string): Promise<void> {
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new AppError('Invalid notification ID format.', 400);
    }

    const notification = await Notification.findById(notificationId);
    if (!notification || notification.dismissed) {
      throw new AppError('Notification not found.', 404);
    }

    if (notification.user.toString() !== userId) {
      throw new AppError('You are not authorized to modify this notification.', 403);
    }

    notification.dismissed = true;
    await notification.save();
  }

  /**
   * Retrieves notification preferences, creating defaults if not yet saved
   */
  public async getPreferences(userId: string): Promise<INotificationPreference> {
    const userObjectId = new Types.ObjectId(userId);
    let prefs = await NotificationPreference.findOne({ user: userObjectId });

    if (!prefs) {
      prefs = new NotificationPreference({
        user: userObjectId,
        interviewReminders: true,
        followUpReminders: true,
        learningMilestones: true,
        roadmapTaskReminders: true,
        timeZone: 'UTC',
      });
      await prefs.save();
    }

    return prefs;
  }

  /**
   * Updates notification preferences
   */
  public async updatePreferences(
    userId: string,
    input: UpdatePreferencesInput
  ): Promise<INotificationPreference> {
    const prefs = await this.getPreferences(userId);

    if (input.interviewReminders !== undefined) prefs.interviewReminders = input.interviewReminders;
    if (input.followUpReminders !== undefined) prefs.followUpReminders = input.followUpReminders;
    if (input.learningMilestones !== undefined) prefs.learningMilestones = input.learningMilestones;
    if (input.roadmapTaskReminders !== undefined) prefs.roadmapTaskReminders = input.roadmapTaskReminders;
    if (input.timeZone !== undefined) prefs.timeZone = input.timeZone.trim();

    await prefs.save();
    return prefs;
  }

  /**
   * Idempotently scans actual student records and creates in-app notifications
   * without duplicating existing alerts, respecting preferences and dates.
   */
  public async syncReminders(userId: string): Promise<{ createdCount: number }> {
    const userObjectId = new Types.ObjectId(userId);
    const prefs = await this.getPreferences(userId);

    let createdCount = 0;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const sevenDaysLater = new Date(startOfToday);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    // 1. Upcoming Interview Reminders
    if (prefs.interviewReminders) {
      const interviewApps = await JobApplication.find({
        user: userObjectId,
        interviewDate: { $gte: startOfToday, $lte: sevenDaysLater },
        status: { $nin: ['Rejected', 'Withdrawn'] },
      }).lean();

      for (const app of interviewApps as unknown as IJobApplication[]) {
        const dateStr = new Date(app.interviewDate!).toISOString().split('T')[0];
        const refId = `${app._id.toString()}_${dateStr}`;
        const refType = 'job_application_interview';

        const exists = await Notification.findOne({
          user: userObjectId,
          referenceType: refType,
          referenceId: refId,
        });

        if (!exists) {
          await Notification.create({
            user: userObjectId,
            type: 'interview',
            title: `Interview Reminder: ${app.company}`,
            message: `Your interview for "${app.jobTitle}" is scheduled on ${new Date(app.interviewDate!).toLocaleDateString()}. Prepare with mock interview practice.`,
            actionUrl: '/interview-prep',
            referenceType: refType,
            referenceId: refId,
            metadata: { applicationId: app._id.toString(), company: app.company },
          });
          createdCount++;
        }
      }
    }

    // 2. Application Follow-up Reminders
    if (prefs.followUpReminders) {
      const followUpApps = await JobApplication.find({
        user: userObjectId,
        followUpDate: { $lte: startOfToday },
        status: { $in: ['Applied', 'Assessment', 'Interview'] },
      }).lean();

      for (const app of followUpApps as unknown as IJobApplication[]) {
        const dateStr = new Date(app.followUpDate!).toISOString().split('T')[0];
        const refId = `${app._id.toString()}_${dateStr}`;
        const refType = 'job_application_follow_up';

        const exists = await Notification.findOne({
          user: userObjectId,
          referenceType: refType,
          referenceId: refId,
        });

        if (!exists) {
          await Notification.create({
            user: userObjectId,
            type: 'follow_up',
            title: `Follow-up Due: ${app.company}`,
            message: `Your scheduled follow-up date for "${app.jobTitle}" has arrived. Consider contacting the recruiter or updating your tracking board.`,
            actionUrl: '/applications',
            referenceType: refType,
            referenceId: refId,
            metadata: { applicationId: app._id.toString(), company: app.company },
          });
          createdCount++;
        }
      }
    }

    // 3. Incomplete Onboarding Reminder
    const profile = await StudentProfile.findOne({ user: userObjectId }).lean();
    if (profile && (profile.completionPercentage ?? 100) < 60) {
      const refId = `onboarding_${userObjectId.toString()}`;
      const refType = 'onboarding_reminder';

      const exists = await Notification.findOne({
        user: userObjectId,
        referenceType: refType,
        referenceId: refId,
      });

      if (!exists) {
        await Notification.create({
          user: userObjectId,
          type: 'onboarding',
          title: 'Complete Your Career Profile',
          message: `Your profile is only ${profile.completionPercentage}% complete. Adding your coursework and skills unlocks tailored career matches and roadmaps.`,
          actionUrl: '/profile',
          referenceType: refType,
          referenceId: refId,
        });
        createdCount++;
      }
    }

    // 4. Learning Milestones & Roadmap Tasks
    if (prefs.learningMilestones || prefs.roadmapTaskReminders) {
      const roadmap = await LearningRoadmap.findOne({
        user: userObjectId,
        status: { $in: ['in-progress', 'active'] },
      }).lean();

      if (roadmap && prefs.learningMilestones && roadmap.overallProgress > 0) {
        const refId = `milestone_${roadmap._id.toString()}_${Math.floor(roadmap.overallProgress / 25) * 25}`;
        const refType = 'learning_milestone';

        const exists = await Notification.findOne({
          user: userObjectId,
          referenceType: refType,
          referenceId: refId,
        });

        if (!exists) {
          await Notification.create({
            user: userObjectId,
            type: 'learning_milestone',
            title: `Learning Progress Milestone: ${roadmap.overallProgress}%`,
            message: `Great job! You have completed ${roadmap.completedTasks} of ${roadmap.totalTasks} tasks in your "${roadmap.targetRole.title}" curriculum.`,
            actionUrl: '/roadmap',
            referenceType: refType,
            referenceId: refId,
          });
          createdCount++;
        }
      }

      // Next important roadmap task
      if (roadmap && prefs.roadmapTaskReminders) {
        const nextTask = roadmap.phases
          .flatMap((p) => p.weeks.flatMap((w) => w.tasks))
          .find((t) => !t.completed);

        if (nextTask) {
          const taskIdStr = nextTask._id ? nextTask._id.toString() : 'task';
          const refId = `task_${roadmap._id.toString()}_${taskIdStr}`;
          const refType = 'roadmap_task';

          const exists = await Notification.findOne({
            user: userObjectId,
            referenceType: refType,
            referenceId: refId,
          });

          if (!exists) {
            await Notification.create({
              user: userObjectId,
              type: 'roadmap_task',
              title: `Upcoming Learning Task`,
              message: `Next in your curriculum: "${nextTask.title}" (~${nextTask.estimatedMinutes}m, ${nextTask.type}). Keep your streak going!`,
              actionUrl: '/roadmap',
              referenceType: refType,
              referenceId: refId,
            });
            createdCount++;
          }
        }
      }
    }

    return { createdCount };
  }
}

export const notificationService = new NotificationService();
