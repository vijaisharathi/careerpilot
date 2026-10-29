import { z } from 'zod';

export const careerAdviceSchema = z.object({
  body: z.object({
    prompt: z.string().trim().min(3, 'Prompt must be at least 3 characters long').max(2000),
    model: z.string().optional(),
    temperature: z.number().min(0).max(1).optional(),
    maxTokens: z.number().int().min(50).max(4000).optional(),
  }),
});

export const assistantChatSchema = z.object({
  body: z.object({
    message: z
      .string({ required_error: 'Message is required' })
      .trim()
      .min(1, 'Message cannot be empty')
      .max(2000, 'Message cannot exceed 2000 characters'),
    conversationId: z.string().trim().optional(),
  }),
});

export const conversationIdSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, 'Conversation ID is required'),
  }),
});

export type AssistantChatBody = z.infer<typeof assistantChatSchema>['body'];
