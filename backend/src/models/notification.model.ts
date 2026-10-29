import { Schema, model, Document, Types } from 'mongoose';

export type NotificationType =
  | 'interview'
  | 'follow_up'
  | 'learning_milestone'
  | 'roadmap_task'
  | 'onboarding'
  | 'job_match'
  | 'system';

export interface INotificationData {
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  readAt?: Date | null;
  dismissed: boolean;
  referenceId?: string;
  referenceType?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification extends Document, INotificationData {
  _id: Types.ObjectId;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'interview',
        'follow_up',
        'learning_milestone',
        'roadmap_task',
        'onboarding',
        'job_match',
        'system',
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    actionUrl: { type: String, trim: true },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    dismissed: { type: Boolean, default: false, index: true },
    referenceId: { type: String, trim: true, index: true },
    referenceType: { type: String, trim: true, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index(
  { user: 1, referenceType: 1, referenceId: 1 },
  { unique: true, sparse: true }
);

export const Notification = model<INotification>('Notification', notificationSchema);

