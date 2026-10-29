import { Request, Response, NextFunction } from 'express';
import { llmService } from '../services/ai/llm.service';
import { assistantAiService } from '../services/ai/assistantAi.service';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import { AssistantChatBody } from '../validations/ai.validation';

export const getAiStatus = (_req: Request, res: Response): void => {
  const status = llmService.getStatus();
  sendSuccess(res, status, 'AI service status retrieved successfully');
};

export const getCareerAdvice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { prompt, model, temperature, maxTokens } = req.body;
    const response = await llmService.generateCompletion(prompt, {
      model,
      temperature,
      maxTokens,
    });

    sendSuccess(res, response, 'Career guidance advice generated successfully');
  } catch (error) {
    next(error);
  }
};

export const chatWithAssistant = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const body = req.body as AssistantChatBody;
    const result = await assistantAiService.sendMessage(userId, body);

    sendSuccess(res, result, 'Assistant response generated successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const getConversations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const conversations = await assistantAiService.getConversations(userId);
    sendSuccess(res, conversations, 'Conversations retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getConversationById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;
    const conversation = await assistantAiService.getConversationById(userId, id);

    sendSuccess(res, conversation, 'Conversation retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;
    await assistantAiService.deleteConversation(userId, id);

    sendSuccess(res, null, 'Conversation deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const clearAllConversations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    await assistantAiService.clearAllConversations(userId);

    sendSuccess(res, null, 'All conversation history cleared successfully');
  } catch (error) {
    next(error);
  }
};

