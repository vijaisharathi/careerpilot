import { Types } from 'mongoose';
import { LearningRoadmap, ILearningRoadmap } from '../models/learningRoadmap.model';
import { StudentProfile } from '../models/studentProfile.model';
import { CareerRole } from '../models/careerRole.model';
import { CareerAnalysis } from '../models/careerAnalysis.model';
import { CAREER_ROLES_CATALOG } from '../config/careerCatalog.data';
import { roadmapGeneratorService } from './roadmapGenerator.service';
import {
  GenerateRoadmapInput,
  UpdateScheduleInput,
  RegenerateRoadmapInput,
} from '../validations/roadmap.validation';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export class RoadmapService {
  /**
   * Retrieves the current active or completed learning roadmap for the student
   */
  public async getActiveRoadmap(userId: string): Promise<ILearningRoadmap | null> {
    const roadmap = await LearningRoadmap.findOne({
      user: new Types.ObjectId(userId),
      status: { $in: ['in-progress', 'completed'] },
    }).sort({ updatedAt: -1 });

    return roadmap;
  }

  /**
   * Generates a new personalized roadmap for the student
   */
  public async generateRoadmap(
    userId: string,
    input: GenerateRoadmapInput
  ): Promise<ILearningRoadmap> {
    const profile = await StudentProfile.findOne({ user: new Types.ObjectId(userId) });
    if (!profile) {
      throw new AppError('Student profile not found. Please complete your profile first.', 404);
    }

    // Determine target role: from input, from profile, or default to full-stack-developer
    let targetRoleSlug = input.targetRoleSlug;
    if (!targetRoleSlug && profile.careerInterests?.targetRoles && profile.careerInterests.targetRoles.length > 0) {
      const preferred = profile.careerInterests.targetRoles[0];
      const matched = CAREER_ROLES_CATALOG.find(
        (r) => r.title.toLowerCase() === preferred.toLowerCase() || r.slug.toLowerCase() === preferred.toLowerCase()
      );
      if (matched) {
        targetRoleSlug = matched.slug;
      }
    }

    if (!targetRoleSlug) {
      targetRoleSlug = 'full-stack-developer';
    }

    // Look up target role in database or catalog
    const roleDb = await CareerRole.findOne({ slug: targetRoleSlug });
    const catalogRole =
      CAREER_ROLES_CATALOG.find((r) => r.slug === targetRoleSlug) ||
      (roleDb ? (roleDb.toObject() as any) : CAREER_ROLES_CATALOG[0]);

    // Check for existing CareerAnalysis
    const latestAnalysis = await CareerAnalysis.findOne({
      user: new Types.ObjectId(userId),
      'targetRole.slug': targetRoleSlug,
    }).sort({ createdAt: -1 });

    const weeklyHours = input.weeklyHours || 10;
    const totalWeeks = input.totalWeeks || 8;

    // Archive any currently active roadmap for this user
    await LearningRoadmap.updateMany(
      { user: new Types.ObjectId(userId), status: 'in-progress' },
      { $set: { status: 'archived' } }
    );

    // Generate phases and tasks
    const generated = await roadmapGeneratorService.generateRoadmap({
      profile,
      role: catalogRole,
      weeklyHours,
      totalWeeks,
    });

    const newRoadmap = new LearningRoadmap({
      user: new Types.ObjectId(userId),
      profileId: profile._id,
      analysisId: latestAnalysis?._id,
      targetRole: {
        slug: catalogRole.slug,
        title: catalogRole.title,
        category: catalogRole.category,
      },
      weeklyHours,
      totalWeeks,
      status: 'in-progress',
      phases: generated.phases,
      version: 1,
      isAiPersonalized: generated.isAiPersonalized,
      aiProvider: generated.aiProvider,
    });

    await newRoadmap.save();

    logger.info(`[RoadmapService] Generated new roadmap for user ${userId} targeting ${catalogRole.title}`);
    return newRoadmap;
  }

  /**
   * Toggles completion status of a specific task within student's active roadmap
   */
  public async toggleTaskCompletion(
    userId: string,
    taskId: string,
    completed: boolean
  ): Promise<ILearningRoadmap> {
    const roadmap = await LearningRoadmap.findOne({
      user: new Types.ObjectId(userId),
      status: { $in: ['in-progress', 'completed'] },
    });

    if (!roadmap) {
      throw new AppError('No active roadmap found for this user', 404);
    }

    // Enforce ownership
    if (roadmap.user.toString() !== userId) {
      throw new AppError('You are not authorized to update this roadmap', 403);
    }

    let taskFound = false;

    for (const phase of roadmap.phases) {
      for (const week of phase.weeks) {
        for (const task of week.tasks) {
          if (task._id && task._id.toString() === taskId) {
            task.completed = completed;
            task.completedAt = completed ? new Date() : null;
            taskFound = true;
            break;
          }
        }
        if (taskFound) break;
      }
      if (taskFound) break;
    }

    if (!taskFound) {
      throw new AppError(`Task with ID ${taskId} was not found in your roadmap`, 404);
    }

    // Saving runs the pre-save hook recalculating overall and phase progress
    await roadmap.save();

    logger.info(
      `[RoadmapService] Task ${taskId} marked ${completed ? 'completed' : 'pending'} for user ${userId}. New progress: ${roadmap.overallProgress}%`
    );

    return roadmap;
  }

  /**
   * Updates student's weekly study budget or total target weeks
   */
  public async updateSchedule(
    userId: string,
    input: UpdateScheduleInput
  ): Promise<ILearningRoadmap> {
    const roadmap = await LearningRoadmap.findOne({
      user: new Types.ObjectId(userId),
      status: { $in: ['in-progress', 'completed'] },
    });

    if (!roadmap) {
      throw new AppError('No active roadmap found. Please generate a roadmap first.', 404);
    }

    // Enforce ownership
    if (roadmap.user.toString() !== userId) {
      throw new AppError('You are not authorized to update this roadmap schedule', 403);
    }

    roadmap.weeklyHours = input.weeklyHours;
    if (input.totalWeeks) {
      roadmap.totalWeeks = input.totalWeeks;
    }

    await roadmap.save();
    return roadmap;
  }

  /**
   * Regenerates roadmap when career targets or skills change, with progress preservation
   */
  public async regenerateRoadmap(
    userId: string,
    input: RegenerateRoadmapInput
  ): Promise<ILearningRoadmap> {
    const profile = await StudentProfile.findOne({ user: new Types.ObjectId(userId) });
    if (!profile) {
      throw new AppError('Student profile not found. Please complete your profile first.', 404);
    }

    const previousRoadmap = await LearningRoadmap.findOne({
      user: new Types.ObjectId(userId),
      status: { $in: ['in-progress', 'completed'] },
    }).sort({ updatedAt: -1 });

    // Collect previously completed tasks for progress preservation
    const completedTasksMap = new Map<string, { completedAt: Date | null }>();

    if (previousRoadmap && input.preserveProgress !== false) {
      for (const phase of previousRoadmap.phases) {
        for (const week of phase.weeks) {
          for (const task of week.tasks) {
            if (task.completed) {
              completedTasksMap.set(task.taskKey, { completedAt: task.completedAt || new Date() });
              completedTasksMap.set(task.title.toLowerCase().trim(), { completedAt: task.completedAt || new Date() });
            }
          }
        }
      }
    }

    // Target role selection
    const targetRoleSlug = input.targetRoleSlug || previousRoadmap?.targetRole.slug || 'full-stack-developer';
    const roleDb = await CareerRole.findOne({ slug: targetRoleSlug });
    const catalogRole =
      CAREER_ROLES_CATALOG.find((r) => r.slug === targetRoleSlug) ||
      (roleDb ? (roleDb.toObject() as any) : CAREER_ROLES_CATALOG[0]);

    const weeklyHours = input.weeklyHours || previousRoadmap?.weeklyHours || 10;
    const totalWeeks = input.totalWeeks || previousRoadmap?.totalWeeks || 8;

    // Archive previous active roadmap
    if (previousRoadmap) {
      previousRoadmap.status = 'archived';
      await previousRoadmap.save();
    }

    // Generate new phases and tasks with progress preserved
    const generated = await roadmapGeneratorService.generateRoadmap({
      profile,
      role: catalogRole,
      weeklyHours,
      totalWeeks,
      existingCompletedTasks: completedTasksMap,
    });

    const newRoadmap = new LearningRoadmap({
      user: new Types.ObjectId(userId),
      profileId: profile._id,
      targetRole: {
        slug: catalogRole.slug,
        title: catalogRole.title,
        category: catalogRole.category,
      },
      weeklyHours,
      totalWeeks,
      status: 'in-progress',
      phases: generated.phases,
      version: (previousRoadmap?.version || 1) + 1,
      isAiPersonalized: generated.isAiPersonalized,
      aiProvider: generated.aiProvider,
    });

    await newRoadmap.save();

    logger.info(
      `[RoadmapService] Regenerated roadmap (v${newRoadmap.version}) for user ${userId}. Preserved ${completedTasksMap.size} completed items. Progress: ${newRoadmap.overallProgress}%`
    );

    return newRoadmap;
  }
}

export const roadmapService = new RoadmapService();
