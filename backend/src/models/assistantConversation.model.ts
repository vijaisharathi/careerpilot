import { Schema, model, Document, Types } from 'mongoose';

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
  _id?: Types.ObjectId;
  role: 'user' | 'assistant' | 'system';
  content: string;
  recommendations?: IRecommendationCard[];
  suggestedFollowUps?: string[];
  contextUsed?: string[];
  isSimulated?: boolean;
  timestamp: Date;
}

export interface IAssistantConversationData {
  user: Types.ObjectId;
  title: string;
  messages: IAssistantMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IAssistantConversation extends Document, IAssistantConversationData {
  _id: Types.ObjectId;
}

const recommendationSchema = new Schema<IRecommendationCard>(
  {
    type: {
      type: String,
      enum: [
        'career_role',
        'skill_gap',
        'roadmap_phase',
        'interview_prep',
        'resume_tip',
        'job_listing',
        'platform_nav',
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    actionLabel: { type: String, trim: true },
    actionUrl: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const messageSchema = new Schema<IAssistantMessage>(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: { type: String, required: true },
    recommendations: { type: [recommendationSchema], default: [] },
    suggestedFollowUps: { type: [String], default: [] },
    contextUsed: { type: [String], default: [] },
    isSimulated: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const assistantConversationSchema = new Schema<IAssistantConversation>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, default: 'New Career Discussion' },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

assistantConversationSchema.index({ user: 1, updatedAt: -1 });

export const AssistantConversation = model<IAssistantConversation>(
  'AssistantConversation',
  assistantConversationSchema
);

