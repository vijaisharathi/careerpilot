import { z } from 'zod';

export const getNotificationsQuerySchema = z.object({
  query: z.object({
    status: z.enum(['all', 'unread']).optional().default('all'),
    type: z
      .enum([
        'all',
        'interview',
        'follow_up',
        'learning_milestone',
        'roadmap_task',
        'onboarding',
        'job_match',
        'system',
      ])
      .optional()
      .default('all'),
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  }),
});

export const notificationIdSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, 'Notification ID is required'),
  }),
});

export const updateNotificationPreferencesSchema = z.object({
  body: z.object({
    interviewReminders: z.boolean().optional(),
    followUpReminders: z.boolean().optional(),
    learningMilestones: z.boolean().optional(),
    roadmapTaskReminders: z.boolean().optional(),
    timeZone: z.string().trim().max(50).optional(),
  }),
});

export type GetNotificationsQuery = z.infer<typeof getNotificationsQuerySchema>['query'];
export type UpdateNotificationPreferencesBody = z.infer<typeof updateNotificationPreferencesSchema>['body'];

