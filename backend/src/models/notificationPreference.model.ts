import { Schema, model, Document, Types } from 'mongoose';

export interface INotificationPreferenceData {
  user: Types.ObjectId;
  interviewReminders: boolean;
  followUpReminders: boolean;
  learningMilestones: boolean;
  roadmapTaskReminders: boolean;
  timeZone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationPreference extends Document, INotificationPreferenceData {
  _id: Types.ObjectId;
}

const notificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    interviewReminders: { type: Boolean, default: true },
    followUpReminders: { type: Boolean, default: true },
    learningMilestones: { type: Boolean, default: true },
    roadmapTaskReminders: { type: Boolean, default: true },
    timeZone: { type: String, default: 'UTC', trim: true },
  },
  { timestamps: true }
);

export const NotificationPreference = model<INotificationPreference>(
  'NotificationPreference',
  notificationPreferenceSchema
);

