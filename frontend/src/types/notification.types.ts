export type NotificationType =
  | 'interview'
  | 'follow_up'
  | 'learning_milestone'
  | 'roadmap_task'
  | 'onboarding'
  | 'job_match'
  | 'system';

export interface INotificationItem {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  readAt?: string | null;
  dismissed: boolean;
  referenceId?: string;
  referenceType?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  interviewReminders: boolean;
  followUpReminders: boolean;
  learningMilestones: boolean;
  roadmapTaskReminders: boolean;
  timeZone: string;
}

export interface SyncRemindersResult {
  createdCount: number;
  message: string;
}

export interface GetNotificationsQuery {
  status?: 'all' | 'unread' | 'read';
  type?: string;
  limit?: number;
}

