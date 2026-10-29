import { Types } from 'mongoose';
import { StudentSkillAssessmentSummary } from '../models/studentSkillAssessmentSummary.model';
import { User } from '../models/user.model';
import { StudentProfile } from '../models/studentProfile.model';

export class PlacementCodingIntegrationService {
  /**
   * Retrieves aggregate coding assessment analytics for an institutional placement officer.
   */
  public async getInstitutionalCodingAnalytics(
    officerActor: { id: string; role: string; institutionId?: string }
  ): Promise<{
    totalStudentsEvaluated: number;
    averageCodingScore: number;
    categoryPerformance: Array<{
      category: string;
      averageAccuracy: number;
      totalAttempts: number;
    }>;
    commonSkillGaps: string[];
    topPerformers: Array<{
      studentId: string;
      studentName: string;
      department: string;
      overallCodingScore: number;
      totalSolved: number;
    }>;
  }> {
    if (!officerActor.institutionId && officerActor.role !== 'admin') {
      throw new Error('Placement Officer is not associated with an institution.');
    }

    const studentFilter: Record<string, any> = { role: 'student' };
    if (officerActor.institutionId) {
      studentFilter.institutionId = new Types.ObjectId(officerActor.institutionId);
    }

    const institutionalStudents = await User.find(studentFilter).select('_id name department');
    const studentIds = institutionalStudents.map((s) => s._id);

    const summaries = await StudentSkillAssessmentSummary.find({
      studentId: { $in: studentIds },
    }).lean();

    const totalStudentsEvaluated = summaries.length;
    const avgScore =
      totalStudentsEvaluated > 0
        ? Math.round(
            summaries.reduce((sum, s) => sum + s.overallCodingScore, 0) / totalStudentsEvaluated
          )
        : 0;

    // Aggregate category performance
    const catMap = new Map<string, { totalAccuracy: number; count: number; attempts: number }>();
    summaries.forEach((s) => {
      s.categoryProficiencies.forEach((cp) => {
        const curr = catMap.get(cp.category) || { totalAccuracy: 0, count: 0, attempts: 0 };
        curr.totalAccuracy += cp.accuracyPercentage;
        curr.count += 1;
        curr.attempts += cp.totalAttempted;
        catMap.set(cp.category, curr);
      });
    });

    const categoryPerformance: Array<{
      category: string;
      averageAccuracy: number;
      totalAttempts: number;
    }> = [];
    const commonSkillGaps: string[] = [];

    catMap.forEach((val, key) => {
      const avgAcc = Math.round(val.totalAccuracy / val.count);
      categoryPerformance.push({
        category: key,
        averageAccuracy: avgAcc,
        totalAttempts: val.attempts,
      });
      if (avgAcc < 50) {
        commonSkillGaps.push(key);
      }
    });

    // Top performers
    const sorted = [...summaries].sort((a, b) => b.overallCodingScore - a.overallCodingScore);
    const topPerformers = sorted.slice(0, 10).map((summary) => {
      const stu = institutionalStudents.find(
        (s) => s._id.toString() === summary.studentId.toString()
      );
      return {
        studentId: summary.studentId.toString(),
        studentName: stu?.name || 'Candidate',
        department: stu?.assignedDepartment || 'Engineering',
        overallCodingScore: summary.overallCodingScore,
        totalSolved: summary.totalProblemsSolved,
      };
    });

    return {
      totalStudentsEvaluated,
      averageCodingScore: avgScore,
      categoryPerformance,
      commonSkillGaps,
      topPerformers,
    };
  }

  /**
   * Retrieves single candidate's technical skill summary scoped to officer's institution.
   */
  public async getCandidateTechnicalSummary(
    officerActor: { id: string; role: string; institutionId?: string },
    studentId: string
  ): Promise<any> {
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      throw new Error('Student not found.');
    }

    if (officerActor.role !== 'admin') {
      const profile = await StudentProfile.findOne({ user: student._id });
      const matchesUserInst =
        student.institutionId && student.institutionId.toString() === officerActor.institutionId;
      const matchesProfileInst =
        profile?.institutionId && profile.institutionId.toString() === officerActor.institutionId;

      if (!matchesUserInst && !matchesProfileInst) {
        throw new Error('Unauthorized: Student does not belong to your institution.');
      }
    }

    const summary = await StudentSkillAssessmentSummary.findOne({
      studentId: new Types.ObjectId(studentId),
    });

    return summary || {
      overallCodingScore: 0,
      totalProblemsSolved: 0,
      totalSubmissions: 0,
      categoryProficiencies: [],
      languageProficiencies: [],
      strengths: [],
      areasForImprovement: [],
    };
  }
}

export const placementCodingIntegrationService = new PlacementCodingIntegrationService();
