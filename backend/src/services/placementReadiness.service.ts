import { Types } from 'mongoose';
import { StudentProfile, IStudentProfile } from '../models/studentProfile.model';
import { CareerAnalysis } from '../models/careerAnalysis.model';
import { ResumeDocument } from '../models/resumeDocument.model';
import { InterviewSession } from '../models/interviewSession.model';
import { LearningRoadmap } from '../models/learningRoadmap.model';
import { StudentSkillAssessmentSummary } from '../models/studentSkillAssessmentSummary.model';

export type ReadinessCategory = 'Ready' | 'Nearly Ready' | 'Needs Preparation' | 'Insufficient Data';

export interface IPlacementReadinessResult {
  studentId: string;
  studentName: string;
  overallScore: number;
  category: ReadinessCategory;
  breakdown: {
    profileCompletenessScore: number; // Max 25
    skillsScore: number;              // Max 25
    careerAssessmentScore: number;    // Max 20
    resumeScore: number;              // Max 15
    interviewPracticeScore: number;   // Max 15
  };
  indicators: {
    profileComplete: boolean;
    hasCompletedAssessment: boolean;
    hasResume: boolean;
    hasPracticedInterviews: boolean;
    roadmapProgressPercentage: number;
  };
  passedCriteria: string[];
  missingCriteria: string[];
  recommendations: string[];
  evaluatedAt: Date;
}

export class PlacementReadinessService {
  /**
   * Deterministically evaluates a student's placement readiness without black-box AI scores.
   */
  public async evaluateReadiness(
    studentUserId: string | Types.ObjectId,
    existingProfile?: IStudentProfile | null
  ): Promise<IPlacementReadinessResult> {
    const userObjectId =
      typeof studentUserId === 'string' ? new Types.ObjectId(studentUserId) : studentUserId;

    // Fetch related records in parallel
    const [profile, latestAnalysis, resumeCount, completedInterviews, roadmap, codingSummary] =
      await Promise.all([
        existingProfile !== undefined
          ? existingProfile
          : StudentProfile.findOne({ user: userObjectId }),
        CareerAnalysis.findOne({ user: userObjectId }).sort({ createdAt: -1 }),
        ResumeDocument.countDocuments({ user: userObjectId }),
        InterviewSession.find({ user: userObjectId, status: 'completed' }).select(
          'summary.overallScore'
        ),
        LearningRoadmap.findOne({ user: userObjectId }).select('overallProgress'),
        StudentSkillAssessmentSummary.findOne({ studentId: userObjectId }),
      ]);

    const studentName = profile?.fullName || 'Student Candidate';

    if (!profile) {
      return {
        studentId: userObjectId.toString(),
        studentName,
        overallScore: 0,
        category: 'Insufficient Data',
        breakdown: {
          profileCompletenessScore: 0,
          skillsScore: 0,
          careerAssessmentScore: 0,
          resumeScore: 0,
          interviewPracticeScore: 0,
        },
        indicators: {
          profileComplete: false,
          hasCompletedAssessment: false,
          hasResume: false,
          hasPracticedInterviews: false,
          roadmapProgressPercentage: 0,
        },
        passedCriteria: [],
        missingCriteria: ['Student profile has not been created'],
        recommendations: ['Complete registration and initialize student profile.'],
        evaluatedAt: new Date(),
      };
    }

    const passedCriteria: string[] = [];
    const missingCriteria: string[] = [];
    const recommendations: string[] = [];

    // 1. Profile Completeness (Weight: 25 points)
    const completion = profile.completionPercentage || 0;
    const profileCompletenessScore = Math.round((completion / 100) * 25);
    if (completion >= 80) {
      passedCriteria.push(`Profile completeness is high (${completion}%)`);
    } else {
      missingCriteria.push(`Profile is incomplete (${completion}%)`);
      recommendations.push('Complete education, bio, and career goals in profile settings.');
    }

    // 2. Skills Depth & Proficiency (Weight: 25 points)
    const skills = profile.skills || [];
    let skillsPoints = 0;
    if (skills.length >= 5) {
      skillsPoints += 15;
      passedCriteria.push(`Has listed ${skills.length} technical skills (threshold >= 5)`);
    } else if (skills.length >= 3) {
      skillsPoints += 10;
      passedCriteria.push(`Has listed ${skills.length} technical skills`);
    } else if (skills.length > 0) {
      skillsPoints += 5;
      missingCriteria.push(`Few skills listed (${skills.length}/5 recommended)`);
      recommendations.push('Add more core technical skills and frameworks to your profile.');
    } else {
      missingCriteria.push('No technical skills recorded on profile');
      recommendations.push('List programming languages, tools, and technical proficiencies.');
    }

    // Proficiency check
    const advancedOrIntermediateCount = skills.filter((s) =>
      ['Intermediate', 'Advanced'].includes(s.proficiency)
    ).length;
    if (advancedOrIntermediateCount >= 3) {
      skillsPoints += 10;
      passedCriteria.push(
        `Has ${advancedOrIntermediateCount} intermediate/advanced proficiencies`
      );
    } else if (advancedOrIntermediateCount >= 1) {
      skillsPoints += 5;
    } else {
      recommendations.push('Upgrade skill proficiencies through coursework and project building.');
    }
    const skillsScore = Math.min(25, skillsPoints);

    // 3. Career Assessment & Role Match (Weight: 20 points)
    let careerAssessmentScore = 0;
    const hasCompletedAssessment = Boolean(latestAnalysis);
    if (latestAnalysis) {
      careerAssessmentScore += 10;
      passedCriteria.push(
        `Completed career analysis for role: ${latestAnalysis.targetRole?.title || 'Target Role'}`
      );
      const readinessScoreFromAnalysis = latestAnalysis.scores?.readinessScore || 0;
      if (readinessScoreFromAnalysis >= 70) {
        careerAssessmentScore += 10;
        passedCriteria.push(
          `Analysis readiness score is strong (${readinessScoreFromAnalysis}/100)`
        );
      } else if (readinessScoreFromAnalysis >= 50) {
        careerAssessmentScore += 6;
      } else {
        missingCriteria.push(
          `Analysis indicates skill gaps for target role (${readinessScoreFromAnalysis}/100)`
        );
        recommendations.push('Review career skill-gap recommendations and follow roadmap.');
      }
    } else {
      missingCriteria.push('Career role analysis has not been completed');
      recommendations.push('Run the Career Role Analysis module to benchmark against target roles.');
    }

    if (codingSummary && codingSummary.totalProblemsSolved > 0) {
      if (codingSummary.overallCodingScore >= 70) {
        careerAssessmentScore = Math.min(20, careerAssessmentScore + 5);
        passedCriteria.push(
          `Verified coding assessment score is strong (${codingSummary.overallCodingScore}/100, ${codingSummary.totalProblemsSolved} problems solved)`
        );
      } else {
        passedCriteria.push(
          `Completed ${codingSummary.totalProblemsSolved} technical coding problems (${codingSummary.overallCodingScore}/100 score)`
        );
      }
    }

    // 4. Resume Readiness (Weight: 15 points)
    let resumeScore = 0;
    const hasResume = resumeCount > 0;
    if (hasResume) {
      resumeScore = 15;
      passedCriteria.push(`Created or uploaded ${resumeCount} resume variant(s)`);
    } else {
      missingCriteria.push('No professional resume on file');
      recommendations.push('Generate a tailored resume using the Resume Builder module.');
    }

    // 5. Mock Interview Practice (Weight: 15 points)
    let interviewPracticeScore = 0;
    const hasPracticedInterviews = completedInterviews.length > 0;
    if (hasPracticedInterviews) {
      interviewPracticeScore += 8;
      const avgScore = Math.round(
        completedInterviews.reduce((acc, s) => acc + (s.summary?.overallScore || 0), 0) /
          completedInterviews.length
      );
      if (avgScore >= 75) {
        interviewPracticeScore += 7;
        passedCriteria.push(
          `Completed ${completedInterviews.length} mock interview(s) with high average (${avgScore}%)`
        );
      } else if (avgScore >= 60) {
        interviewPracticeScore += 4;
        passedCriteria.push(
          `Completed ${completedInterviews.length} mock interview(s) (${avgScore}%)`
        );
      } else {
        missingCriteria.push(
          `Mock interview performance needs refinement (average ${avgScore}%)`
        );
        recommendations.push('Practice technical questions in the AI Mock Interview module.');
      }
    } else {
      missingCriteria.push('No mock interview practice sessions completed');
      recommendations.push('Conduct at least one mock technical or HR interview session.');
    }

    const overallScore = Math.min(
      100,
      profileCompletenessScore +
        skillsScore +
        careerAssessmentScore +
        resumeScore +
        interviewPracticeScore
    );

    // Determine readiness category
    let category: ReadinessCategory = 'Needs Preparation';
    if (completion < 35 || skills.length === 0) {
      category = 'Insufficient Data';
    } else if (overallScore >= 70 && completion >= 70) {
      category = 'Ready';
    } else if (overallScore >= 50) {
      category = 'Nearly Ready';
    } else {
      category = 'Needs Preparation';
    }

    return {
      studentId: userObjectId.toString(),
      studentName,
      overallScore,
      category,
      breakdown: {
        profileCompletenessScore,
        skillsScore,
        careerAssessmentScore,
        resumeScore,
        interviewPracticeScore,
      },
      indicators: {
        profileComplete: completion >= 80,
        hasCompletedAssessment,
        hasResume,
        hasPracticedInterviews,
        roadmapProgressPercentage: roadmap?.overallProgress || 0,
      },
      passedCriteria,
      missingCriteria,
      recommendations,
      evaluatedAt: new Date(),
    };
  }
}

export const placementReadinessService = new PlacementReadinessService();

