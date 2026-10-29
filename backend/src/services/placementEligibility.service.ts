import { IStudentProfile } from '../models/studentProfile.model';
import { IPlacementDrive } from '../models/placementDrive.model';
import {
  CandidateEligibilityStatus,
  IEligibilityEvaluation,
} from '../models/placementRegistration.model';
import { placementReadinessService } from './placementReadiness.service';

export class PlacementEligibilityService {
  /**
   * Deterministically evaluates candidate eligibility for a recruitment drive based on configured rules.
   */
  public async evaluateEligibility(
    studentProfile: IStudentProfile,
    drive: IPlacementDrive
  ): Promise<IEligibilityEvaluation & { status: CandidateEligibilityStatus }> {
    const passedChecks: string[] = [];
    const failedChecks: string[] = [];
    let hasMissingInfo = false;

    const criteria = drive.eligibilityCriteria || {
      eligibleDepartments: [],
      eligibleGraduationYears: [],
    };

    // 1. Department Check
    const allowedDepts = (criteria.eligibleDepartments || []).map((d) => d.toLowerCase().trim());
    if (allowedDepts.length > 0) {
      const studentDept = (studentProfile.department || '').toLowerCase().trim();
      if (!studentDept) {
        hasMissingInfo = true;
        failedChecks.push('Student department is not recorded in profile');
      } else {
        const matchesDept = allowedDepts.some(
          (ad) => studentDept.includes(ad) || ad.includes(studentDept)
        );
        if (matchesDept) {
          passedChecks.push(`Department matches eligibility (${studentProfile.department})`);
        } else {
          failedChecks.push(
            `Department "${studentProfile.department}" is not among eligible departments: ${criteria.eligibleDepartments.join(', ')}`
          );
        }
      }
    } else {
      passedChecks.push('Open to all departments');
    }

    // 2. Graduation Year Check
    const allowedYears = criteria.eligibleGraduationYears || [];
    if (allowedYears.length > 0) {
      if (!studentProfile.graduationYear) {
        hasMissingInfo = true;
        failedChecks.push('Student graduation year is not recorded in profile');
      } else if (allowedYears.includes(studentProfile.graduationYear)) {
        passedChecks.push(`Graduation year matches eligibility (${studentProfile.graduationYear})`);
      } else {
        failedChecks.push(
          `Graduation year ${studentProfile.graduationYear} does not match eligible batches: ${allowedYears.join(', ')}`
        );
      }
    } else {
      passedChecks.push('Open to all graduation years');
    }

    // 3. Minimum Profile Completion Check
    if (criteria.minProfileCompletion && criteria.minProfileCompletion > 0) {
      const completion = studentProfile.completionPercentage || 0;
      if (completion >= criteria.minProfileCompletion) {
        passedChecks.push(
          `Profile completion (${completion}%) meets minimum requirement of ${criteria.minProfileCompletion}%`
        );
      } else {
        failedChecks.push(
          `Profile completion (${completion}%) is below minimum required ${criteria.minProfileCompletion}%`
        );
      }
    }

    // 4. Minimum Academic / GPA Criteria Check
    if (criteria.minGpa && criteria.minGpa > 0) {
      // Find GPA in education history if available
      let studentGpa: number | null = null;
      for (const edu of studentProfile.educationHistory || []) {
        if (edu.gpa) {
          const parsed = parseFloat(edu.gpa);
          if (!isNaN(parsed)) {
            studentGpa = parsed;
            break;
          }
        }
      }

      if (studentGpa === null) {
        hasMissingInfo = true;
        failedChecks.push(
          `Academic GPA is unverified on profile (Drive requires min GPA ${criteria.minGpa})`
        );
      } else if (studentGpa >= criteria.minGpa) {
        passedChecks.push(
          `Academic GPA (${studentGpa}) meets required threshold of ${criteria.minGpa}`
        );
      } else {
        failedChecks.push(
          `Academic GPA (${studentGpa}) does not satisfy required minimum of ${criteria.minGpa}`
        );
      }
    }

    // 5. Minimum Readiness Score Check (if configured)
    if (criteria.minReadinessScore && criteria.minReadinessScore > 0) {
      const readiness = await placementReadinessService.evaluateReadiness(
        studentProfile.user,
        studentProfile
      );
      if (readiness.overallScore >= criteria.minReadinessScore) {
        passedChecks.push(
          `Placement readiness score (${readiness.overallScore}/100) satisfies minimum requirement of ${criteria.minReadinessScore}`
        );
      } else {
        failedChecks.push(
          `Placement readiness score (${readiness.overallScore}/100) is below requirement of ${criteria.minReadinessScore}`
        );
      }
    }

    // 6. Required Skills Match Check
    const requiredSkills = (drive.requiredSkills || []).map((s) => s.toLowerCase().trim());
    if (requiredSkills.length > 0) {
      const studentSkills = (studentProfile.skills || []).map((s) => s.name.toLowerCase().trim());
      const matched = requiredSkills.filter((req) => studentSkills.some((s) => s.includes(req) || req.includes(s)));
      const matchPercentage = Math.round((matched.length / requiredSkills.length) * 100);

      if (matchPercentage >= 50) {
        passedChecks.push(
          `Skills match: ${matched.length}/${requiredSkills.length} required skills (${matchPercentage}%)`
        );
      } else if (criteria.requiredSkillsMustMatch) {
        failedChecks.push(
          `Skills requirement unmet: only ${matched.length}/${requiredSkills.length} required skills matched (${matchPercentage}%)`
        );
      } else {
        passedChecks.push(
          `Skills partially matched (${matched.length}/${requiredSkills.length}) - recommended for review`
        );
      }
    }

    // Determine status
    let status: CandidateEligibilityStatus = 'eligible';
    let notes = '';

    if (failedChecks.length === 0) {
      status = 'eligible';
      notes = 'Candidate satisfies all mandatory drive eligibility criteria.';
    } else if (hasMissingInfo && failedChecks.length === 1) {
      status = 'needs_review';
      notes = 'Candidate matches core criteria but has missing/unverified academic records requiring review.';
    } else if (hasMissingInfo && failedChecks.length > 1) {
      status = 'insufficient_information';
      notes = 'Candidate profile lacks critical criteria (e.g. department or graduation year) to confirm eligibility.';
    } else {
      status = 'not_eligible';
      notes = `Candidate does not meet ${failedChecks.length} configured drive criteria.`;
    }

    return {
      status,
      calculatedAt: new Date(),
      ruleVersion: 'v1.0',
      passedChecks,
      failedChecks,
      notes,
      isOverridden: false,
    };
  }
}

export const placementEligibilityService = new PlacementEligibilityService();

