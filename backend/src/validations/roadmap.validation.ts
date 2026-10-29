import { z } from 'zod';

export const generateRoadmapSchema = z.object({
  body: z.object({
    targetRoleSlug: z.string().trim().optional(),
    weeklyHours: z.number().int().min(3, 'Minimum study time is 3 hours/week').max(40, 'Maximum study time is 40 hours/week').optional(),
    totalWeeks: z.number().int().min(2, 'Minimum roadmap duration is 2 weeks').max(24, 'Maximum roadmap duration is 24 weeks').optional(),
  }),
});

export const updateTaskStatusSchema = z.object({
  params: z.object({
    taskId: z.string().trim().min(1, 'Task ID is required'),
  }),
  body: z.object({
    completed: z.boolean({ required_error: 'completed status (true/false) is required' }),
  }),
});

export const updateScheduleSchema = z.object({
  body: z.object({
    weeklyHours: z.number().int().min(3, 'Minimum study time is 3 hours/week').max(40, 'Maximum study time is 40 hours/week'),
    totalWeeks: z.number().int().min(2, 'Minimum roadmap duration is 2 weeks').max(24, 'Maximum roadmap duration is 24 weeks').optional(),
  }),
});

export const regenerateRoadmapSchema = z.object({
  body: z.object({
    targetRoleSlug: z.string().trim().optional(),
    weeklyHours: z.number().int().min(3, 'Minimum study time is 3 hours/week').max(40, 'Maximum study time is 40 hours/week').optional(),
    totalWeeks: z.number().int().min(2, 'Minimum roadmap duration is 2 weeks').max(24, 'Maximum roadmap duration is 24 weeks').optional(),
    preserveProgress: z.boolean().optional().default(true),
  }),
});

export type GenerateRoadmapInput = z.infer<typeof generateRoadmapSchema>['body'];
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>['body'];
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>['body'];
export type RegenerateRoadmapInput = z.infer<typeof regenerateRoadmapSchema>['body'];

