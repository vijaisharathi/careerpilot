import { z } from 'zod';

export const createInterviewSessionSchema = z.object({
  body: z.object({
    targetRole: z
      .string({ required_error: 'Target role is required' })
      .trim()
      .min(2, 'Target role must be at least 2 characters')
      .max(100),
    interviewType: z.enum(['technical', 'hr']).optional().default('technical'),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional().default('Intermediate'),
    questionCount: z.coerce.number().int().min(1).max(10).optional().default(3),
    topics: z.array(z.string().trim().max(50)).optional().default([]),
  }),
});

export const submitAnswerSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, 'Session ID is required'),
  }),
  body: z.object({
    questionIndex: z.coerce.number().int().min(0, 'Question index must be non-negative'),
    studentAnswer: z
      .string({ required_error: 'Answer is required' })
      .trim()
      .min(5, 'Answer must be at least 5 characters')
      .max(15000, 'Answer cannot exceed 15000 characters'),
  }),
});

export const getSessionByIdSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, 'Session ID is required'),
  }),
});

