import { z } from 'zod';

export const searchJobsSchema = z.object({
  query: z.object({
    q: z.string().trim().optional(),
    employmentType: z.string().trim().optional(),
    workMode: z.string().trim().optional(),
    roleCategory: z.string().trim().optional(),
    skill: z.string().trim().optional(),
    location: z.string().trim().optional(),
    minScore: z.coerce.number().min(0).max(100).optional(),
    verifiedOnly: z.coerce.boolean().optional(),
    sortBy: z.enum(['relevance', 'date', 'deadline']).optional().default('relevance'),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  }),
});

export const saveJobSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, 'Opportunity ID is required'),
  }),
  body: z.object({
    notes: z.string().trim().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  }),
});

export const getJobByIdSchema = z.object({
  params: z.object({
    idOrSlug: z.string().trim().min(1, 'Opportunity ID or slug is required'),
  }),
});

export type SearchJobsQuery = z.infer<typeof searchJobsSchema>['query'];
export type SaveJobBody = z.infer<typeof saveJobSchema>['body'];

