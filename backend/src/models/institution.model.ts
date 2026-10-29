import { Schema, model, Document, Types } from 'mongoose';

export interface IInstitutionData {
  name: string;
  code: string;
  domain?: string;
  departments: string[];
  address?: string;
  contactEmail?: string;
  websiteUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInstitution extends Document, IInstitutionData {
  _id: Types.ObjectId;
}

const institutionSchema = new Schema<IInstitution>(
  {
    name: {
      type: String,
      required: [true, 'Institution name is required'],
      trim: true,
      maxlength: 150,
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Institution code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: 2,
      maxlength: 20,
      index: true,
    },
    domain: {
      type: String,
      trim: true,
      lowercase: true,
    },
    departments: {
      type: [String],
      default: [
        'Computer Science and Engineering',
        'Information Technology',
        'Electronics and Communication Engineering',
        'Electrical and Electronics Engineering',
        'Mechanical Engineering',
        'Data Science and Artificial Intelligence',
      ],
    },
    address: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    websiteUrl: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
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

export const Institution = model<IInstitution>('Institution', institutionSchema);

