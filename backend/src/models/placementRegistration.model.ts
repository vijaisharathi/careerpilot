import { Schema, model, Document, Types } from 'mongoose';

export type CandidateEligibilityStatus =
  | 'eligible'
  | 'not_eligible'
  | 'needs_review'
  | 'insufficient_information';

export type RecruitmentStage =
  | 'registered'
  | 'shortlisted'
  | 'assessment'
  | 'interview'
  | 'selected'
  | 'offered'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export interface IStageHistoryEntry {
  stage: RecruitmentStage;
  timestamp: Date;
  updatedBy: Types.ObjectId;
  comment?: string;
}

export interface IEligibilityEvaluation {
  calculatedAt: Date;
  ruleVersion: string;
  passedChecks: string[];
  failedChecks: string[];
  notes: string;
  isOverridden?: boolean;
  overriddenBy?: Types.ObjectId;
  overrideReason?: string;
  overriddenAt?: Date;
}

export interface IOfferDetails {
  salary?: string;
  designation?: string;
  offerLetterUrl?: string;
  recordedAt?: Date;
  terms?: string;
}

export interface IPlacementRegistrationData {
  driveId: Types.ObjectId;
  studentId: Types.ObjectId;
  institutionId: Types.ObjectId;
  eligibilityStatus: CandidateEligibilityStatus;
  eligibilityEvaluation: IEligibilityEvaluation;
  currentStage: RecruitmentStage;
  stageHistory: IStageHistoryEntry[];
  offerDetails?: IOfferDetails;
  appliedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlacementRegistration extends Document, IPlacementRegistrationData {
  _id: Types.ObjectId;
}

const stageHistorySchema = new Schema<IStageHistoryEntry>(
  {
    stage: {
      type: String,
      enum: [
        'registered',
        'shortlisted',
        'assessment',
        'interview',
        'selected',
        'offered',
        'accepted',
        'rejected',
        'withdrawn',
      ],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const eligibilityEvaluationSchema = new Schema<IEligibilityEvaluation>(
  {
    calculatedAt: { type: Date, default: Date.now },
    ruleVersion: { type: String, default: 'v1.0' },
    passedChecks: { type: [String], default: [] },
    failedChecks: { type: [String], default: [] },
    notes: { type: String, default: '' },
    isOverridden: { type: Boolean, default: false },
    overriddenBy: { type: Schema.Types.ObjectId, ref: 'User' },
    overrideReason: { type: String, trim: true },
    overriddenAt: { type: Date },
  },
  { _id: false }
);

const offerDetailsSchema = new Schema<IOfferDetails>(
  {
    salary: { type: String, trim: true },
    designation: { type: String, trim: true },
    offerLetterUrl: { type: String, trim: true },
    recordedAt: { type: Date, default: Date.now },
    terms: { type: String, trim: true },
  },
  { _id: false }
);

const placementRegistrationSchema = new Schema<IPlacementRegistration>(
  {
    driveId: {
      type: Schema.Types.ObjectId,
      ref: 'PlacementDrive',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    eligibilityStatus: {
      type: String,
      enum: ['eligible', 'not_eligible', 'needs_review', 'insufficient_information'],
      default: 'needs_review',
      index: true,
    },
    eligibilityEvaluation: {
      type: eligibilityEvaluationSchema,
      required: true,
    },
    currentStage: {
      type: String,
      enum: [
        'registered',
        'shortlisted',
        'assessment',
        'interview',
        'selected',
        'offered',
        'accepted',
        'rejected',
        'withdrawn',
      ],
      default: 'registered',
      index: true,
    },
    stageHistory: {
      type: [stageHistorySchema],
      default: [],
    },
    offerDetails: {
      type: offerDetailsSchema,
    },
    appliedDate: {
      type: Date,
      default: Date.now,
      index: true,
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

// Prevent duplicate registrations for the same student on the same drive
placementRegistrationSchema.index({ driveId: 1, studentId: 1 }, { unique: true });

// Scoped queries for institution-wide analytics and candidate listings
placementRegistrationSchema.index({ institutionId: 1, currentStage: 1 });

export const PlacementRegistration = model<IPlacementRegistration>(
  'PlacementRegistration',
  placementRegistrationSchema
);

