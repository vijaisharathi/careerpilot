export type RecommendationType =
  | 'career_role'
  | 'skill_gap'
  | 'roadmap_phase'
  | 'interview_prep'
  | 'resume_tip'
  | 'job_listing'
  | 'platform_nav';

export interface IRecommendationCard {
  type: RecommendationType;
  title: string;
  description: string;
  actionLabel?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface IAssistantMessage {
  _id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  recommendations?: IRecommendationCard[];
  suggestedFollowUps?: string[];
  contextUsed?: string[];
  isSimulated?: boolean;
  timestamp: string | Date;
}

export interface IConversationSummary {
  _id: string;
  title: string;
  messageCount: number;
  lastMessageSnippet: string;
  createdAt: string;
  updatedAt: string;
}

export interface IAssistantConversation {
  _id: string;
  user: string;
  title: string;
  messages: IAssistantMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SendAssistantMessagePayload {
  message: string;
  conversationId?: string;
}

export interface AssistantChatResponse {
  conversationId: string;
  message: IAssistantMessage;
  recommendations: IRecommendationCard[];
  suggestedFollowUps: string[];
  contextUsed: string[];
  conversationTitle: string;
}

