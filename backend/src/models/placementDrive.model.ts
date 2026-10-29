import { Schema, model, Document, Types } from 'mongoose';

export type PlacementDriveStatus =
  | 'draft'
  | 'published'
  | 'registration_open'
  | 'registration_closed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface IDriveEligibilityCriteria {
  eligibleDepartments: string[];
  eligibleGraduationYears: number[];
  minGpa?: number;
  minReadinessScore?: number;
  minProfileCompletion?: number;
  requiredSkillsMustMatch?: boolean;
}

export interface IPlacementDriveData {
  institutionId: Types.ObjectId;
  companyName: string;
  driveTitle: string;
  jobRole: string;
  jobDescription: string;
  requiredSkills: string[];
  eligibilityCriteria: IDriveEligibilityCriteria;
  openingsCount?: number;
  location: string;
  employmentType: 'Full-time' | 'Internship' | 'Co-op' | 'Contract';
  workMode: 'On-site' | 'Hybrid' | 'Remote';
  compensation?: {
    amount: string;
    period: 'yearly' | 'monthly' | 'hourly';
    currency: string;
  };
  registrationStartDate: Date;
  registrationDeadline: Date;
  assessmentDate?: Date;
  interviewDates?: Date[];
  applicationUrl?: string;
  status: PlacementDriveStatus;
  assignedOfficerId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlacementDrive extends Document, IPlacementDriveData {
  _id: Types.ObjectId;
}

const eligibilityCriteriaSchema = new Schema<IDriveEligibilityCriteria>(
  {
    eligibleDepartments: { type: [String], default: [] },
    eligibleGraduationYears: { type: [Number], default: [] },
    minGpa: { type: Number, min: 0, max: 10 },
    minReadinessScore: { type: Number, min: 0, max: 100 },
    minProfileCompletion: { type: Number, min: 0, max: 100 },
    requiredSkillsMustMatch: { type: Boolean, default: false },
  },
  { _id: false }
);

const placementDriveSchema = new Schema<IPlacementDrive>(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: 120,
      index: true,
    },
    driveTitle: {
      type: String,
      required: [true, 'Drive title is required'],
      trim: true,
      maxlength: 200,
    },
    jobRole: {
      type: String,
      required: [true, 'Job role is required'],
      trim: true,
      maxlength: 120,
    },
    jobDescription: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    eligibilityCriteria: {
      type: eligibilityCriteriaSchema,
      default: () => ({
        eligibleDepartments: [],
        eligibleGraduationYears: [],
      }),
    },
    openingsCount: {
      type: Number,
      min: 1,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Internship', 'Co-op', 'Contract'],
      default: 'Full-time',
    },
    workMode: {
      type: String,
      enum: ['On-site', 'Hybrid', 'Remote'],
      default: 'On-site',
    },
    compensation: {
      amount: { type: String, default: '' },
      period: { type: String, enum: ['yearly', 'monthly', 'hourly'], default: 'yearly' },
      currency: { type: String, default: 'USD' },
    },
    registrationStartDate: {
      type: Date,
      required: [true, 'Registration start date is required'],
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Registration deadline is required'],
      index: true,
    },
    assessmentDate: {
      type: Date,
    },
    interviewDates: {
      type: [Date],
      default: [],
    },
    applicationUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        'draft',
        'published',
        'registration_open',
        'registration_closed',
        'in_progress',
        'completed',
        'cancelled',
      ],
      default: 'draft',
      index: true,
    },
    assignedOfficerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

// Compound index for querying active drives by institution and status
placementDriveSchema.index({ institutionId: 1, status: 1, registrationDeadline: 1 });

export const PlacementDrive = model<IPlacementDrive>('PlacementDrive', placementDriveSchema);

