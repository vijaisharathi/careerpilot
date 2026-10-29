import { apiClient } from './api.client';
import {
  INotificationItem,
  NotificationPreferences,
  SyncRemindersResult,
  GetNotificationsQuery,
} from '../types/notification.types';

export const notificationService = {
  /**
   * Retrieves student notifications with optional status/type filtering
   */
  getNotifications: async (query?: GetNotificationsQuery): Promise<INotificationItem[]> => {
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.type) params.append('type', query.type);
    if (query?.limit) params.append('limit', String(query.limit));

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const data = await apiClient.get<INotificationItem[]>(`/notifications${queryString}`);
    return data || [];
  },

  /**
   * Retrieves unread notification count for the header badge
   */
  getUnreadCount: async (): Promise<number> => {
    try {
      const data = await apiClient.get<{ unreadCount: number }>('/notifications/unread-count');
      return data?.unreadCount || 0;
    } catch {
      return 0;
    }
  },

  /**
   * Marks a specific notification as read
   */
  markAsRead: async (notificationId: string): Promise<INotificationItem> => {
    return apiClient.patch<INotificationItem>(`/notifications/${notificationId}/read`);
  },

  /**
   * Marks all student notifications as read
   */
  markAllAsRead: async (): Promise<{ modifiedCount: number }> => {
    return apiClient.patch<{ modifiedCount: number }>('/notifications/mark-all-read');
  },

  /**
   * Dismisses / deletes a notification
   */
  dismissNotification: async (notificationId: string): Promise<void> => {
    await apiClient.delete(`/notifications/${notificationId}`);
  },

  /**
   * Retrieves student notification preferences
   */
  getPreferences: async (): Promise<NotificationPreferences> => {
    return apiClient.get<NotificationPreferences>('/notifications/preferences');
  },

  /**
   * Updates student notification preferences
   */
  updatePreferences: async (
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> => {
    return apiClient.put<NotificationPreferences>('/notifications/preferences', preferences);
  },

  /**
   * Evaluates active applications and roadmap to generate in-app reminders idempotently
   */
  syncReminders: async (): Promise<SyncRemindersResult> => {
    return apiClient.post<SyncRemindersResult>('/notifications/sync-reminders');
  },
};

