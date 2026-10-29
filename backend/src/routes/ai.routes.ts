import { Router } from 'express';
import { aiController } from '../controllers';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { aiRateLimiter } from '../middleware/rateLimit.middleware';
import {
  careerAdviceSchema,
  assistantChatSchema,
  conversationIdSchema,
} from '../validations/ai.validation';

const router = Router();

// Public / general AI status & basic advice
router.get('/status', aiController.getAiStatus);
router.post('/career-advice', aiRateLimiter, validateRequest(careerAdviceSchema), aiController.getCareerAdvice);

// Authenticated AI Career Assistant endpoints
router.post(
  '/assistant/chat',
  authenticate,
  aiRateLimiter,
  validateRequest(assistantChatSchema),
  aiController.chatWithAssistant
);

router.get('/assistant/conversations', authenticate, aiController.getConversations);
router.delete('/assistant/conversations', authenticate, aiController.clearAllConversations);

router.get(
  '/assistant/conversations/:id',
  authenticate,
  validateRequest(conversationIdSchema),
  aiController.getConversationById
);

router.delete(
  '/assistant/conversations/:id',
  authenticate,
  validateRequest(conversationIdSchema),
  aiController.deleteConversation
);

export default router;
