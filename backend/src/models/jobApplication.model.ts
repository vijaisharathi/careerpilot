import { Schema, model, Document, Types } from 'mongoose';

export type ApplicationStatus =
  | 'Saved'
  | 'Applied'
  | 'Assessment'
  | 'Interview'
  | 'Offer'
  | 'Rejected'
  | 'Withdrawn';

export interface IStatusHistoryEntry {
  status: ApplicationStatus;
  changedAt: Date;
  notes?: string;
}

export interface IJobApplicationData {
  user: Types.ObjectId;
  company: string;
  jobTitle: string;
  jobOpportunity?: Types.ObjectId;
  applicationUrl?: string;
  status: ApplicationStatus;
  appliedDate?: Date;
  interviewDate?: Date;
  deadline?: Date;
  followUpDate?: Date;
  notes?: string;
  location?: string;
  employmentType?: string;
  workMode?: string;
  compensation?: string;
  statusHistory: IStatusHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IJobApplication extends Document, IJobApplicationData {
  _id: Types.ObjectId;
}

const statusHistorySchema = new Schema<IStatusHistoryEntry>(
  {
    status: {
      type: String,
      enum: ['Saved', 'Applied', 'Assessment', 'Interview', 'Offer', 'Rejected', 'Withdrawn'],
      required: true,
    },
    changedAt: { type: Date, default: Date.now },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const jobApplicationSchema = new Schema<IJobApplication>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: String, required: true, trim: true },
    jobTitle: { type: String, required: true, trim: true },
    jobOpportunity: {
      type: Schema.Types.ObjectId,
      ref: 'JobOpportunity',
      default: null,
      index: true,
    },
    applicationUrl: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['Saved', 'Applied', 'Assessment', 'Interview', 'Offer', 'Rejected', 'Withdrawn'],
      default: 'Applied',
      index: true,
    },
    appliedDate: { type: Date, default: Date.now },
    interviewDate: { type: Date },
    deadline: { type: Date },
    followUpDate: { type: Date },
    notes: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    employmentType: { type: String, trim: true, default: '' },
    workMode: { type: String, trim: true, default: '' },
    compensation: { type: String, trim: true, default: '' },
    statusHistory: { type: [statusHistorySchema], default: [] },
  },
  { timestamps: true }
);

jobApplicationSchema.index({ user: 1, status: 1 });
jobApplicationSchema.index({ user: 1, appliedDate: -1 });
jobApplicationSchema.index({ user: 1, company: 1, jobTitle: 1 });
jobApplicationSchema.index({ user: 1, followUpDate: 1 });
jobApplicationSchema.index({ user: 1, interviewDate: 1 });

export const JobApplication = model<IJobApplication>('JobApplication', jobApplicationSchema);

