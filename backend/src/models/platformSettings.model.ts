import { Schema, model, Document, Types } from 'mongoose';

export interface IPlatformSettingsData {
  platformName: string;
  supportEmail: string;
  jobPublicationRules: {
    requireAdminApproval: boolean;
    autoArchiveExpiredDays: number;
    allowStudentSubmissions: boolean;
  };
  learningResourceVisibility: {
    requireVerificationToPublish: boolean;
    showFreeOnlyByDefault: boolean;
  };
  notificationPreferences: {
    notifyOnNewRegistrations: boolean;
    notifyOnJobApplicationSubmissions: boolean;
  };
  systemNotice?: string;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlatformSettings extends Document, IPlatformSettingsData {
  _id: Types.ObjectId;
}

const platformSettingsSchema = new Schema<IPlatformSettings>(
  {
    platformName: {
      type: String,
      default: 'Career Pilot AI',
      trim: true,
      maxlength: 100,
    },
    supportEmail: {
      type: String,
      default: 'support@careerpilot.ai',
      trim: true,
      lowercase: true,
    },
    jobPublicationRules: {
      requireAdminApproval: { type: Boolean, default: true },
      autoArchiveExpiredDays: { type: Number, default: 30, min: 1 },
      allowStudentSubmissions: { type: Boolean, default: false },
    },
    learningResourceVisibility: {
      requireVerificationToPublish: { type: Boolean, default: true },
      showFreeOnlyByDefault: { type: Boolean, default: false },
    },
    notificationPreferences: {
      notifyOnNewRegistrations: { type: Boolean, default: true },
      notifyOnJobApplicationSubmissions: { type: Boolean, default: false },
    },
    systemNotice: {
      type: String,
      trim: true,
      default: '',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
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

export const PlatformSettings = model<IPlatformSettings>('PlatformSettings', platformSettingsSchema);

