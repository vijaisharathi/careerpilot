import { Types } from 'mongoose';
import { StudentProfile } from '../models/studentProfile.model';
import { CareerRole } from '../models/careerRole.model';
import { CareerAnalysis, ICareerAnalysis } from '../models/careerAnalysis.model';
import { CAREER_ROLES_CATALOG, CatalogRoleDefinition } from '../config/careerCatalog.data';
import { careerScoringService } from './careerScoring.service';
import { careerAiService } from './careerAi.service';
import { AppError } from '../utils/appError';
import { getMongoConnectionState } from '../config/database';
import { logger } from '../utils/logger';

export class CareerAnalysisService {
  private checkDatabaseReady(): void {
    if (getMongoConnectionState() !== 'connected') {
      throw new AppError(
        'Database is not currently connected. Please ensure MongoDB is running and MONGODB_URI is configured.',
        503
      );
    }
  }

  /**
   * Seed career roles catalog if database collection is empty
   */
  public async ensureCatalogSeeded(): Promise<void> {
    if (getMongoConnectionState() !== 'connected') return;

    try {
      const count = await CareerRole.countDocuments();
      if (count === 0) {
        logger.info('[CareerAnalysisService] Seeding default career roles catalog into MongoDB...');
        await CareerRole.insertMany(CAREER_ROLES_CATALOG);
        logger.info(`[CareerAnalysisService] Seeded ${CAREER_ROLES_CATALOG.length} career roles successfully.`);
      }
    } catch (err) {
      logger.error('[CareerAnalysisService] Failed to seed career roles catalog:', (err as Error).message);
    }
  }

  /**
   * Retrieves all supported career roles from catalog
   */
  public async getRoles(): Promise<CatalogRoleDefinition[]> {
    this.checkDatabaseReady();
    await this.ensureCatalogSeeded();

    const roles = await CareerRole.find({ isActive: { $ne: false } }).sort({ title: 1 });
    if (roles && roles.length > 0) {
      return roles.map((r) => r.toJSON() as CatalogRoleDefinition);
    }

    return CAREER_ROLES_CATALOG;
  }

  /**
   * Retrieves single career role by slug
   */
  public async getRoleBySlug(slug: string): Promise<CatalogRoleDefinition> {
    this.checkDatabaseReady();
    await this.ensureCatalogSeeded();

    const normalized = slug.toLowerCase().trim();
    const role = await CareerRole.findOne({ slug: normalized });
    if (role) return role.toJSON() as CatalogRoleDefinition;

    // Check catalog directly as fallback
    const catalogItem = CAREER_ROLES_CATALOG.find((r) => r.slug === normalized);
    if (catalogItem) return catalogItem;

    throw AppError.notFound(`Career role '${slug}' was not found in catalog`);
  }

  /**
   * Runs end-to-end career suitability & skill gap analysis for authenticated student
   */
  public async runAnalysis(
    userId: string,
    targetRoleSlug?: string
  ): Promise<ICareerAnalysis> {
    this.checkDatabaseReady();
    await this.ensureCatalogSeeded();

    // 1. Retrieve authenticated student profile
    const profile = await StudentProfile.findOne({ user: userId });
    if (!profile) {
      throw AppError.notFound('Student profile not found. Please complete your profile first.');
    }

    // 2. Validate sufficient profile information exists
    if (!profile.skills || profile.skills.length === 0) {
      throw AppError.badRequest(
        'Please add at least 1 technical skill to your profile before running Career Analysis.'
      );
    }

    // 3. Resolve target role from parameter, student preference, or default
    let resolvedSlug = targetRoleSlug;
    if (!resolvedSlug && profile.careerInterests?.targetRoles?.length) {
      const preferred = profile.careerInterests.targetRoles[0].toLowerCase();
      const match = CAREER_ROLES_CATALOG.find((r) =>
        r.title.toLowerCase().includes(preferred) || preferred.includes(r.title.toLowerCase())
      );
      if (match) resolvedSlug = match.slug;
    }

    if (!resolvedSlug) {
      resolvedSlug = 'full-stack-developer';
    }

    const role = await this.getRoleBySlug(resolvedSlug);

    // 4. Run deterministic scoring engine
    const deterministic = careerScoringService.runDeterministicAnalysis(profile, role);

    // 5. Generate AI / explainable narrative recommendations
    const explanation = await careerAiService.generateExplanation(profile, role, deterministic);

    // 6. Persist completed analysis record in MongoDB
    const roleDoc = await CareerRole.findOne({ slug: role.slug });

    const analysis = new CareerAnalysis({
      user: profile.user,
      profileId: profile._id,
      targetRole: {
        roleId: roleDoc?._id,
        title: role.title,
        slug: role.slug,
        category: role.category,
      },
      profileSnapshot: {
        skillsCount: profile.skills.length,
        projectsCount: profile.projects.length,
        experienceCount: profile.experience.length,
        lastProfileUpdate: profile.updatedAt || new Date(),
      },
      scores: deterministic.scores,
      matchedSkills: deterministic.matchedSkills,
      missingSkills: deterministic.missingSkills,
      strengths: deterministic.strengths,
      improvementAreas: deterministic.improvementAreas,
      aiExplanation: explanation,
      isStale: false,
    });

    await analysis.save();

    logger.info(`[CareerAnalysisService] Analysis completed for user ${userId} targeting ${role.title}: Readiness ${deterministic.scores.readinessScore}%`);

    return analysis;
  }

  /**
   * Retrieves the latest analysis for the user, computing staleness if profile was modified
   */
  public async getLatestAnalysis(userId: string): Promise<ICareerAnalysis | null> {
    this.checkDatabaseReady();

    const analysis = await CareerAnalysis.findOne({ user: userId }).sort({ createdAt: -1 });
    if (!analysis) return null;

    const profile = await StudentProfile.findOne({ user: userId });
    if (profile && profile.updatedAt > analysis.createdAt) {
      analysis.isStale = true;
    }

    return analysis;
  }

  /**
   * Retrieves analysis history for the user
   */
  public async getAnalysisHistory(userId: string): Promise<ICareerAnalysis[]> {
    this.checkDatabaseReady();
    return CareerAnalysis.find({ user: userId }).sort({ createdAt: -1 }).limit(20);
  }

  /**
   * Retrieves single analysis by ID with ownership enforcement
   */
  public async getAnalysisById(userId: string, analysisId: string): Promise<ICareerAnalysis> {
    this.checkDatabaseReady();

    if (!Types.ObjectId.isValid(analysisId)) {
      throw AppError.badRequest('Invalid analysis ID');
    }

    const analysis = await CareerAnalysis.findById(analysisId);
    if (!analysis) {
      throw AppError.notFound('Career analysis record not found');
    }

    // Strict ownership verification
    if (analysis.user.toString() !== userId) {
      throw AppError.forbidden('You are not authorized to access this analysis record');
    }

    return analysis;
  }
}

export const careerAnalysisService = new CareerAnalysisService();
