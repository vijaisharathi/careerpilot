import { Schema, model, Document, Types } from 'mongoose';

export type ResourceType =
  | 'Official Documentation'
  | 'Tutorial'
  | 'Interactive Course'
  | 'Guide'
  | 'Practice Platform'
  | 'Cheat Sheet'
  | 'Video Course'
  | 'Book';

export type ResourceDifficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
export type ResourcePublicationStatus = 'draft' | 'published' | 'archived';

export interface ILearningResourceData {
  title: string;
  description: string;
  topic: string;
  relatedSkill: string;
  resourceUrl: string;
  resourceType: ResourceType;
  difficulty: ResourceDifficulty;
  estimatedDurationMinutes: number;
  publicationStatus: ResourcePublicationStatus;
  isFree: boolean;
  provider: string;
  isVerified: boolean;
  verificationDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILearningResource extends Document, ILearningResourceData {
  _id: Types.ObjectId;
}

const learningResourceSchema = new Schema<ILearningResource>(
  {
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true, index: true },
    relatedSkill: { type: String, required: true, trim: true, lowercase: true, index: true },
    resourceUrl: { type: String, required: true, trim: true },
    resourceType: {
      type: String,
      enum: [
        'Official Documentation',
        'Tutorial',
        'Interactive Course',
        'Guide',
        'Practice Platform',
        'Cheat Sheet',
        'Video Course',
        'Book',
      ],
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
      default: 'All Levels',
    },
    estimatedDurationMinutes: { type: Number, default: 60, min: 5 },
    publicationStatus: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true,
    },
    isFree: { type: Boolean, default: true },
    provider: { type: String, required: true, trim: true },
    isVerified: { type: Boolean, default: false, index: true },
    verificationDate: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        if (ret._id) {
          ret.id = ret._id.toString();
        }
        delete ret.__v;
        return ret;
      },
    },
  }
);

learningResourceSchema.index({ relatedSkill: 1, publicationStatus: 1 });
learningResourceSchema.index({ topic: 1, publicationStatus: 1 });
learningResourceSchema.index({ title: 'text', description: 'text', topic: 'text' });

export const LearningResource = model<ILearningResource>('LearningResource', learningResourceSchema);

