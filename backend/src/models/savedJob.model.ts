import { Schema, model, Document, Types } from 'mongoose';

export interface ISavedJob extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  job: Types.ObjectId;
  notes?: string;
  savedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const savedJobSchema = new Schema<ISavedJob>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    job: {
      type: Schema.Types.ObjectId,
      ref: 'JobOpportunity',
      required: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    savedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate saves of the same job by the same student
savedJobSchema.index({ user: 1, job: 1 }, { unique: true });

export const SavedJob = model<ISavedJob>('SavedJob', savedJobSchema);

