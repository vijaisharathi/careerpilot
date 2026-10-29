import { Schema, model, Document, Types } from 'mongoose';
import { VerifiedResource } from '../config/learningResources.data';

export type RoadmapTaskType =
  | 'Concept'
  | 'Hands-on Exercise'
  | 'Project'
  | 'DSA'
  | 'Reading'
  | 'Assessment';

export interface IRoadmapTask {
  _id?: Types.ObjectId;
  taskKey: string;
  title: string;
  type: RoadmapTaskType;
  learningObjective: string;
  estimatedMinutes: number;
  completed: boolean;
  completedAt?: Date | null;
  resources: VerifiedResource[];
}

export interface IRoadmapWeek {
  weekNumber: number;
  theme: string;
  tasks: IRoadmapTask[];
}

export interface IRoadmapPhase {
  phaseNumber: number;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  progress: number; // 0-100%
  weeks: IRoadmapWeek[];
}

export interface ILearningRoadmap extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  profileId: Types.ObjectId;
  analysisId?: Types.ObjectId;
  targetRole: {
    slug: string;
    title: string;
    category: string;
  };
  weeklyHours: number;
  totalWeeks: number;
  totalTasks: number;
  completedTasks: number;
  overallProgress: number; // 0-100%
  status: 'in-progress' | 'completed' | 'archived';
  phases: IRoadmapPhase[];
  version: number;
  isAiPersonalized: boolean;
  aiProvider: string;
  createdAt: Date;
  updatedAt: Date;
}

const verifiedResourceSchema = new Schema<VerifiedResource>(
  {
    title: { type: String, required: true },
    type: { type: String, required: true },
    url: { type: String, required: true },
    isFree: { type: Boolean, default: true },
    provider: { type: String, required: true },
  },
  { _id: false }
);

const roadmapTaskSchema = new Schema<IRoadmapTask>(
  {
    taskKey: { type: String, required: true },
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ['Concept', 'Hands-on Exercise', 'Project', 'DSA', 'Reading', 'Assessment'],
      required: true,
    },
    learningObjective: { type: String, required: true },
    estimatedMinutes: { type: Number, required: true, min: 15 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    resources: { type: [verifiedResourceSchema], default: [] },
  },
  { _id: true }
);

const roadmapWeekSchema = new Schema<IRoadmapWeek>(
  {
    weekNumber: { type: Number, required: true },
    theme: { type: String, required: true },
    tasks: { type: [roadmapTaskSchema], default: [] },
  },
  { _id: false }
);

const roadmapPhaseSchema = new Schema<IRoadmapPhase>(
  {
    phaseNumber: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['completed', 'in-progress', 'upcoming'],
      default: 'upcoming',
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    weeks: { type: [roadmapWeekSchema], default: [] },
  },
  { _id: false }
);

const learningRoadmapSchema = new Schema<ILearningRoadmap>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    profileId: {
      type: Schema.Types.ObjectId,
      ref: 'StudentProfile',
      required: true,
    },
    analysisId: {
      type: Schema.Types.ObjectId,
      ref: 'CareerAnalysis',
      required: false,
    },
    targetRole: {
      slug: { type: String, required: true },
      title: { type: String, required: true },
      category: { type: String, required: true },
    },
    weeklyHours: { type: Number, required: true, min: 3, max: 40, default: 10 },
    totalWeeks: { type: Number, required: true, min: 2, max: 24, default: 8 },
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    overallProgress: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['in-progress', 'completed', 'archived'],
      default: 'in-progress',
      index: true,
    },
    phases: { type: [roadmapPhaseSchema], default: [] },
    version: { type: Number, default: 1 },
    isAiPersonalized: { type: Boolean, default: false },
    aiProvider: { type: String, default: 'deterministic' },
  },
  {
    timestamps: true,
  }
);

// Indexes
learningRoadmapSchema.index({ user: 1, status: 1 });
learningRoadmapSchema.index({ user: 1, 'targetRole.slug': 1 });

/**
 * Pre-save hook: auto-recalculate task counts and progress percentages
 */
learningRoadmapSchema.pre('save', function (next) {
  let allTasksCount = 0;
  let allCompletedCount = 0;

  for (const phase of this.phases) {
    let phaseTasks = 0;
    let phaseCompleted = 0;

    for (const week of phase.weeks) {
      for (const task of week.tasks) {
        phaseTasks += 1;
        if (task.completed) {
          phaseCompleted += 1;
        }
      }
    }

    allTasksCount += phaseTasks;
    allCompletedCount += phaseCompleted;

    const phaseProgress = phaseTasks > 0 ? Math.round((phaseCompleted / phaseTasks) * 100) : 0;
    phase.progress = phaseProgress;

    if (phaseProgress === 100 && phaseTasks > 0) {
      phase.status = 'completed';
    } else if (phaseCompleted > 0 || phase.status === 'in-progress') {
      phase.status = 'in-progress';
    }
  }

  this.totalTasks = allTasksCount;
  this.completedTasks = allCompletedCount;
  this.overallProgress = allTasksCount > 0 ? Math.round((allCompletedCount / allTasksCount) * 100) : 0;

  if (this.overallProgress === 100 && allTasksCount > 0) {
    this.status = 'completed';
  } else if (this.status === 'completed' && this.overallProgress < 100) {
    this.status = 'in-progress';
  }

  next();
});

export const LearningRoadmap = model<ILearningRoadmap>('LearningRoadmap', learningRoadmapSchema);

