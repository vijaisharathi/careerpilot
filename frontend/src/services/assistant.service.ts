import { apiClient } from './api.client';
import {
  IConversationSummary,
  IAssistantConversation,
  AssistantChatResponse,
  SendAssistantMessagePayload,
} from '../types/assistant.types';

export const assistantService = {
  /**
   * Sends a message to the AI Career Assistant
   */
  sendMessage: async (payload: SendAssistantMessagePayload): Promise<AssistantChatResponse> => {
    return apiClient.post<AssistantChatResponse>('/ai/assistant/chat', payload);
  },

  /**
   * Retrieves list of all past conversations for the authenticated student
   */
  getConversations: async (): Promise<IConversationSummary[]> => {
    try {
      const data = await apiClient.get<IConversationSummary[]>('/ai/assistant/conversations');
      return data || [];
    } catch {
      return [];
    }
  },

  /**
   * Retrieves full conversation message history by ID
   */
  getConversationById: async (id: string): Promise<IAssistantConversation> => {
    return apiClient.get<IAssistantConversation>(`/ai/assistant/conversations/${id}`);
  },

  /**
   * Deletes a single conversation
   */
  deleteConversation: async (id: string): Promise<void> => {
    await apiClient.delete(`/ai/assistant/conversations/${id}`);
  },

  /**
   * Clears all conversation history
   */
  clearAllConversations: async (): Promise<void> => {
    await apiClient.delete('/ai/assistant/conversations');
  },
};

