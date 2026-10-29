import { Schema, model, Document, Types } from 'mongoose';

export interface IPlacementAnnouncementData {
  institutionId: Types.ObjectId;
  title: string;
  content: string;
  relatedDriveId?: Types.ObjectId;
  targetDepartments: string[];
  targetGraduationYears: number[];
  publicationDate: Date;
  expirationDate?: Date;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlacementAnnouncement extends Document, IPlacementAnnouncementData {
  _id: Types.ObjectId;
}

const placementAnnouncementSchema = new Schema<IPlacementAnnouncement>(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
      trim: true,
    },
    relatedDriveId: {
      type: Schema.Types.ObjectId,
      ref: 'PlacementDrive',
      index: true,
    },
    targetDepartments: {
      type: [String],
      default: [],
    },
    targetGraduationYears: {
      type: [Number],
      default: [],
    },
    publicationDate: {
      type: Date,
      default: Date.now,
    },
    expirationDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
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

placementAnnouncementSchema.index({ institutionId: 1, isActive: 1, publicationDate: -1 });

export const PlacementAnnouncement = model<IPlacementAnnouncement>(
  'PlacementAnnouncement',
  placementAnnouncementSchema
);

