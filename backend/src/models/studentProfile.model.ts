import { Schema, model, Document, Types } from 'mongoose';

export interface IEducationEntry {
  _id?: Types.ObjectId;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface ISkillEntry {
  _id?: Types.ObjectId;
  name: string;
  category: 'languages' | 'frameworks' | 'databases' | 'cloud' | 'soft_skills';
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced';
  verified: boolean;
}

export interface IProjectEntry {
  _id?: Types.ObjectId;
  title: string;
  technologies: string[];
  link?: string;
  bullets: string[];
}

export interface ICertificationEntry {
  _id?: Types.ObjectId;
  title: string;
  issuer: string;
  issueDate: string;
  credentialUrl?: string;
}

export interface IExperienceEntry {
  _id?: Types.ObjectId;
  role: string;
  company: string;
  location?: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface ICareerInterests {
  targetRoles: string[];
  preferredLocations: string[];
  preferredMode: 'Remote' | 'Hybrid' | 'On-site' | 'Any';
  careerGoals?: string;
  targetCompensation?: string;
}

export interface IStudentProfile extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  headline?: string;
  college: string;
  institutionId?: Types.ObjectId;
  degree: string;
  department: string;
  graduationYear?: number;
  placementStatus?: 'unplaced' | 'in_process' | 'placed';
  educationHistory: Types.DocumentArray<IEducationEntry & Document>;
  skills: Types.DocumentArray<ISkillEntry & Document>;
  projects: Types.DocumentArray<IProjectEntry & Document>;
  certifications: Types.DocumentArray<ICertificationEntry & Document>;
  experience: Types.DocumentArray<IExperienceEntry & Document>;
  careerInterests: ICareerInterests;
  completionPercentage: number;
  createdAt: Date;
  updatedAt: Date;
  calculateCompletion(): number;
}

const educationEntrySchema = new Schema<IEducationEntry>(
  {
    institution: { type: String, required: true, trim: true },
    degree: { type: String, required: true, trim: true },
    field: { type: String, required: true, trim: true },
    startDate: { type: String, required: true, trim: true },
    endDate: { type: String, required: true, trim: true },
    gpa: { type: String, trim: true },
  },
  { timestamps: true }
);

const skillEntrySchema = new Schema<ISkillEntry>(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['languages', 'frameworks', 'databases', 'cloud', 'soft_skills'],
      default: 'languages',
    },
    proficiency: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate',
    },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const projectEntrySchema = new Schema<IProjectEntry>(
  {
    title: { type: String, required: true, trim: true },
    technologies: { type: [String], default: [] },
    link: { type: String, trim: true },
    bullets: { type: [String], default: [] },
  },
  { timestamps: true }
);

const certificationEntrySchema = new Schema<ICertificationEntry>(
  {
    title: { type: String, required: true, trim: true },
    issuer: { type: String, required: true, trim: true },
    issueDate: { type: String, required: true, trim: true },
    credentialUrl: { type: String, trim: true },
  },
  { timestamps: true }
);

const experienceEntrySchema = new Schema<IExperienceEntry>(
  {
    role: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    startDate: { type: String, required: true, trim: true },
    endDate: { type: String, required: true, trim: true },
    current: { type: Boolean, default: false },
    bullets: { type: [String], default: [] },
  },
  { timestamps: true }
);

const careerInterestsSchema = new Schema<ICareerInterests>(
  {
    targetRoles: { type: [String], default: [] },
    preferredLocations: { type: [String], default: [] },
    preferredMode: {
      type: String,
      enum: ['Remote', 'Hybrid', 'On-site', 'Any'],
      default: 'Hybrid',
    },
    careerGoals: { type: String, trim: true },
    targetCompensation: { type: String, trim: true },
  },
  { _id: false }
);

const studentProfileSchema = new Schema<IStudentProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    headline: { type: String, trim: true },
    college: { type: String, default: '', trim: true },
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      index: true,
    },
    degree: { type: String, default: '', trim: true },
    department: { type: String, default: '', trim: true, index: true },
    graduationYear: { type: Number, index: true },
    placementStatus: {
      type: String,
      enum: ['unplaced', 'in_process', 'placed'],
      default: 'unplaced',
      index: true,
    },
    educationHistory: { type: [educationEntrySchema], default: [] },
    skills: { type: [skillEntrySchema], default: [] },
    projects: { type: [projectEntrySchema], default: [] },
    certifications: { type: [certificationEntrySchema], default: [] },
    experience: { type: [experienceEntrySchema], default: [] },
    careerInterests: {
      type: careerInterestsSchema,
      default: () => ({
        targetRoles: [],
        preferredLocations: [],
        preferredMode: 'Hybrid',
      }),
    },
    completionPercentage: { type: Number, default: 0 },
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

// Method to calculate overall profile completion percentage
studentProfileSchema.methods.calculateCompletion = function (): number {
  let score = 0;

  // 1. Basic Info (20 points)
  if (this.fullName && this.college && this.degree && this.department) {
    score += 20;
  } else if (this.fullName && (this.college || this.degree)) {
    score += 10;
  }

  // 2. Education history (15 points)
  if (this.educationHistory && this.educationHistory.length > 0) {
    score += 15;
  }

  // 3. Technical Skills (20 points for >= 3 skills, 10 for 1-2)
  if (this.skills && this.skills.length >= 3) {
    score += 20;
  } else if (this.skills && this.skills.length > 0) {
    score += 10;
  }

  // 4. Projects (15 points)
  if (this.projects && this.projects.length > 0) {
    score += 15;
  }

  // 5. Work Experience / Internships (15 points)
  if (this.experience && this.experience.length > 0) {
    score += 15;
  }

  // 6. Career Interests / Target Roles (15 points)
  if (this.careerInterests?.targetRoles && this.careerInterests.targetRoles.length > 0) {
    score += 15;
  }

  return Math.min(Math.round(score), 100);
};

// Automatically re-compute completion before saving
studentProfileSchema.pre('save', function (next) {
  this.completionPercentage = this.calculateCompletion();
  next();
});

export const StudentProfile = model<IStudentProfile>('StudentProfile', studentProfileSchema);

