import { IStudentProfile, ISkillEntry, IProjectEntry, IExperienceEntry } from '../models/studentProfile.model';
import { CatalogRoleDefinition, CatalogSkillRequirement } from '../config/careerCatalog.data';
import {
  IMatchedSkill,
  IMissingSkill,
  ICareerAnalysisScores,
} from '../models/careerAnalysis.model';

export interface DeterministicAnalysisResult {
  scores: ICareerAnalysisScores;
  matchedSkills: IMatchedSkill[];
  missingSkills: IMissingSkill[];
  strengths: string[];
  improvementAreas: string[];
}

export class CareerScoringService {
  /**
   * Maps qualitative proficiency levels to ordered numeric ranks:
   * Beginner = 1, Intermediate = 2, Advanced = 3
   */
  public proficiencyToRank(level: string): number {
    switch (level?.toLowerCase()) {
      case 'advanced':
        return 3;
      case 'intermediate':
        return 2;
      case 'beginner':
      default:
        return 1;
    }
  }

  /**
   * Normalizes skill tokens for robust canonical comparison (handles aliases and parentheticals)
   */
  public normalizeSkill(skill: string): string {
    return skill
      .toLowerCase()
      .replace(/\.js\b/g, '')
      .replace(/\(es6\+\)/g, '')
      .replace(/[()+/&]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Checks whether student skill matches a required role skill
   */
  public isSkillMatch(studentSkillName: string, requiredSkillName: string): boolean {
    const s1 = this.normalizeSkill(studentSkillName);
    const s2 = this.normalizeSkill(requiredSkillName);

    if (s1 === s2) return true;

    // Direct token inclusions (e.g. 'react' matches 'react.js', 'node' matches 'node.js & express')
    const tokens1 = s1.split(' ').filter(Boolean);
    const tokens2 = s2.split(' ').filter(Boolean);

    // If core tokens overlap significantly
    const hasCoreOverlap = tokens1.some((t1) => tokens2.includes(t1) && t1.length > 2);
    return hasCoreOverlap;
  }

  /**
   * Deterministic Skill Match Calculation
   * Weight critical skills 3x, recommended skills 1x.
   * Partial credits awarded if student has skill at lower proficiency than role requires.
   */
  public evaluateSkills(
    studentSkills: ISkillEntry[],
    requiredSkills: CatalogSkillRequirement[]
  ): {
    skillMatchScore: number;
    matchedSkills: IMatchedSkill[];
    missingSkills: IMissingSkill[];
    strengths: string[];
    improvementAreas: string[];
  } {
    const matchedSkills: IMatchedSkill[] = [];
    const missingSkills: IMissingSkill[] = [];
    const strengths: string[] = [];
    const improvementAreas: string[] = [];

    let totalPossibleWeightedScore = 0;
    let earnedWeightedScore = 0;

    for (const req of requiredSkills) {
      const importanceMultiplier = req.importance === 'critical' ? 3 : 1;
      const weight = (req.weight || 3) * importanceMultiplier;
      totalPossibleWeightedScore += weight;

      // Find matching student skill
      const studentSkill = studentSkills.find((s) => this.isSkillMatch(s.name, req.name));

      if (studentSkill) {
        const studentRank = this.proficiencyToRank(studentSkill.proficiency);
        const requiredRank = this.proficiencyToRank(req.minProficiency);

        let status: 'met' | 'exceeded' | 'partial' = 'met';
        let creditRatio = 1.0;

        if (studentRank > requiredRank) {
          status = 'exceeded';
          creditRatio = 1.0;
          strengths.push(`${studentSkill.name} (${studentSkill.proficiency} proficiency exceeds the ${req.minProficiency} requirement)`);
        } else if (studentRank === requiredRank) {
          status = 'met';
          creditRatio = 1.0;
          strengths.push(`${studentSkill.name} (${studentSkill.proficiency} satisfies standard role expectation)`);
        } else {
          status = 'partial';
          creditRatio = studentRank / requiredRank; // e.g. 1/2 = 50%, 2/3 = 66%
          improvementAreas.push(`Advance ${studentSkill.name} from ${studentSkill.proficiency} to ${req.minProficiency}`);
        }

        earnedWeightedScore += weight * creditRatio;

        matchedSkills.push({
          name: req.name,
          category: req.category,
          studentLevel: studentSkill.proficiency,
          requiredLevel: req.minProficiency,
          status,
          creditPercentage: Math.round(creditRatio * 100),
        });
      } else {
        // Missing skill
        const estimatedHours = req.minProficiency === 'Advanced' ? 35 : req.minProficiency === 'Intermediate' ? 20 : 10;
        missingSkills.push({
          name: req.name,
          category: req.category,
          requiredLevel: req.minProficiency,
          importance: req.importance,
          estimatedHours,
          whyNeeded: req.importance === 'critical' ? 'Core mandatory capability for role screening' : 'Recommended competitive differentiator',
        });

        if (req.importance === 'critical') {
          improvementAreas.push(`Acquire ${req.name} (${req.minProficiency} level needed)`);
        }
      }
    }

    const skillMatchScore =
      totalPossibleWeightedScore > 0
        ? Math.min(100, Math.round((earnedWeightedScore / totalPossibleWeightedScore) * 100))
        : 0;

    return {
      skillMatchScore,
      matchedSkills,
      missingSkills,
      strengths: strengths.slice(0, 5),
      improvementAreas: improvementAreas.slice(0, 5),
    };
  }

  /**
   * Project Relevance Calculation (0-100)
   * Evaluates project count and whether technologies overlap with role requirements.
   */
  public evaluateProjects(
    projects: IProjectEntry[],
    requiredSkills: CatalogSkillRequirement[]
  ): number {
    if (!projects || projects.length === 0) return 20; // Baseline starting score

    let score = 30; // Baseline for having at least 1 project

    // Up to 3 projects give incremental credit
    score += Math.min(30, projects.length * 10);

    // Check technological overlap
    const projectTechs = projects.flatMap((p) => p.technologies || []).map((t) => this.normalizeSkill(t));
    const roleTechs = requiredSkills.map((r) => this.normalizeSkill(r.name));

    let matchingTechCount = 0;
    for (const tech of projectTechs) {
      if (roleTechs.some((rt) => rt.includes(tech) || tech.includes(rt))) {
        matchingTechCount++;
      }
    }

    score += Math.min(40, matchingTechCount * 10);
    return Math.min(100, score);
  }

  /**
   * Experience / Internship Relevance Calculation (0-100)
   */
  public evaluateExperience(experience: IExperienceEntry[]): number {
    if (!experience || experience.length === 0) return 30; // Baseline for students

    let score = 50;
    score += Math.min(40, experience.length * 20); // Each internship/role adds 20

    // Current role or multi-bullet experiences show depth
    const hasDetailedBullets = experience.some((e) => e.bullets && e.bullets.length >= 2);
    if (hasDetailedBullets) score += 10;

    return Math.min(100, score);
  }

  /**
   * Academic & Profile Readiness Calculation (0-100)
   */
  public evaluateAcademics(profile: IStudentProfile): number {
    let score = 50;

    if (profile.college) score += 15;
    if (profile.degree && profile.department) score += 15;
    if (profile.graduationYear) score += 10;
    if (profile.completionPercentage >= 70) score += 10;

    return Math.min(100, score);
  }

  /**
   * Master Deterministic Analysis Evaluator
   * Computes weighted readiness score and returns structured data.
   */
  public runDeterministicAnalysis(
    profile: IStudentProfile,
    role: CatalogRoleDefinition
  ): DeterministicAnalysisResult {
    // 1. Skill Match Score (Weight: 50%)
    const skillResult = this.evaluateSkills(profile.skills || [], role.requiredSkills);

    // 2. Project Relevance Score (Weight: 20%)
    const projectScore = this.evaluateProjects(profile.projects || [], role.requiredSkills);

    // 3. Experience Score (Weight: 15%)
    const experienceScore = this.evaluateExperience(profile.experience || []);

    // 4. Academic & Profile Score (Weight: 15%)
    const academicScore = this.evaluateAcademics(profile);

    // 5. Total Weighted Readiness Score
    const weightedReadiness =
      0.5 * skillResult.skillMatchScore +
      0.2 * projectScore +
      0.15 * experienceScore +
      0.15 * academicScore;

    const readinessScore = Math.min(100, Math.round(weightedReadiness));

    let suitabilityLevel: 'High Match' | 'Moderate Match' | 'Developing Match' = 'Developing Match';
    if (readinessScore >= 75) {
      suitabilityLevel = 'High Match';
    } else if (readinessScore >= 50) {
      suitabilityLevel = 'Moderate Match';
    }

    const scores: ICareerAnalysisScores = {
      readinessScore,
      skillMatchScore: skillResult.skillMatchScore,
      projectScore,
      experienceScore,
      academicScore,
      suitabilityLevel,
    };

    return {
      scores,
      matchedSkills: skillResult.matchedSkills,
      missingSkills: skillResult.missingSkills,
      strengths: skillResult.strengths,
      improvementAreas: skillResult.improvementAreas,
    };
  }
}

export const careerScoringService = new CareerScoringService();
