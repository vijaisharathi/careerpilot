import { Types } from 'mongoose';
import { StudentProfile } from '../models/studentProfile.model';
import { CareerAnalysis } from '../models/careerAnalysis.model';
import { LearningRoadmap } from '../models/learningRoadmap.model';
import { JobApplication, IJobApplication } from '../models/jobApplication.model';
import { SavedJob } from '../models/savedJob.model';
import { ResumeAnalysis } from '../models/resumeAnalysis.model';
import { InterviewSession } from '../models/interviewSession.model';

export interface DashboardMetricSummary {
  profile: {
    name: string;
    college: string;
    degree: string;
    graduationYear: number;
    completionPercentage: number;
    targetRoles: string[];
    skillsCount: number;
  };
  careerAnalysis: {
    hasAnalysis: boolean;
    targetRole?: string;
    readinessScore?: number;
    suitabilityLevel?: string;
    topStrengths?: string[];
    criticalGapsCount?: number;
    recommendedGapsCount?: number;
    analyzedAt?: Date;
  };
  skillGaps: Array<{
    name: string;
    category: string;
    requiredLevel: string;
    importance: 'critical' | 'recommended';
    estimatedHours: number;
  }>;
  roadmap: {
    hasRoadmap: boolean;
    targetRole?: string;
    totalTasks?: number;
    completedTasks?: number;
    overallProgress?: number;
    weeklyHours?: number;
    totalWeeks?: number;
    upcomingTasks?: Array<{
      _id: string;
      title: string;
      learningObjective: string;
      estimatedMinutes: number;
      type: string;
    }>;
  };
  jobs: {
    totalSaved: number;
    savedJobs: Array<{
      id: string;
      title: string;
      company: string;
      location: string;
      employmentType: string;
    }>;
  };
  applications: {
    totalApplications: number;
    activePipelineCount: number;
    responseRatePercentage: number;
    stageCounts: {
      saved: number;
      applied: number;
      assessment: number;
      interview: number;
      offer: number;
      rejected: number;
      withdrawn: number;
    };
  };
  upcomingInterviews: Array<{
    id: string;
    company: string;
    jobTitle: string;
    interviewDate: Date;
    location: string;
    notes?: string;
  }>;
  pendingFollowUps: {
    overdueCount: number;
    overdue: Array<{
      id: string;
      company: string;
      jobTitle: string;
      followUpDate: Date;
      status: string;
    }>;
    upcomingCount: number;
    upcoming: Array<{
      id: string;
      company: string;
      jobTitle: string;
      followUpDate: Date;
      status: string;
    }>;
  };
  recentInterviewPractice: Array<{
    id: string;
    targetRole: string;
    interviewType: string;
    difficulty: string;
    score: number;
    completedAt: Date;
    answeredCount: number;
    totalQuestions: number;
  }>;
  resumeAnalysis: {
    hasAnalysis: boolean;
    targetJobTitle?: string;
    overallScore?: number;
    missingKeywordsCount?: number;
    matchedKeywordsCount?: number;
    analyzedAt?: Date;
  };
  recommendedNextActions: Array<{
    id: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    actionLabel: string;
    actionUrl: string;
  }>;
}

export class DashboardService {
  /**
   * Calculates comprehensive student dashboard metrics from real persisted database records.
   * Documented calculation rules:
   * - Missing data is represented honestly with hasX: false and 0 counts.
   * - Dates are evaluated against the current midnight boundary.
   * - Response rate = (Assessment + Interview + Offer) / (Total - Saved) * 100.
   */
  public async getDashboardSummary(userId: string): Promise<DashboardMetricSummary> {
    const userObjectId = new Types.ObjectId(userId);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const sevenDaysFromNow = new Date(startOfToday);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Run parallel database queries for efficiency
    const [
      profileDoc,
      careerAnalysisDoc,
      roadmapDoc,
      applicationsDocs,
      savedJobsDocs,
      resumeAnalysisDoc,
      interviewSessionsDocs,
    ] = await Promise.all([
      StudentProfile.findOne({ user: userObjectId }).lean(),
      CareerAnalysis.findOne({ user: userObjectId }).sort({ createdAt: -1 }).lean(),
      LearningRoadmap.findOne({
        user: userObjectId,
        status: { $in: ['in-progress', 'active', 'not-started'] },
      })
        .sort({ updatedAt: -1 })
        .lean(),
      JobApplication.find({ user: userObjectId }).sort({ appliedDate: -1 }).lean(),
      SavedJob.find({ user: userObjectId })
        .populate('job', 'title company location employmentType')
        .sort({ savedAt: -1 })
        .lean(),
      ResumeAnalysis.findOne({ user: userObjectId }).sort({ createdAt: -1 }).lean(),
      InterviewSession.find({ user: userObjectId, status: 'completed' })
        .sort({ completedAt: -1 })
        .limit(3)
        .lean(),
    ]);

    // 1. Profile Metrics
    let completionPercentage = profileDoc?.completionPercentage || 0;
    if (completionPercentage === 0 && profileDoc) {
      let score = 0;
      if (profileDoc.fullName && profileDoc.college && profileDoc.degree && profileDoc.department) {
        score += 20;
      } else if (profileDoc.fullName && (profileDoc.college || profileDoc.degree)) {
        score += 10;
      }
      if (profileDoc.educationHistory && profileDoc.educationHistory.length > 0) score += 15;
      if (profileDoc.skills && profileDoc.skills.length >= 3) score += 20;
      else if (profileDoc.skills && profileDoc.skills.length > 0) score += 10;
      if (profileDoc.projects && profileDoc.projects.length > 0) score += 15;
      if (profileDoc.experience && profileDoc.experience.length > 0) score += 15;
      if (profileDoc.careerInterests?.targetRoles && profileDoc.careerInterests.targetRoles.length > 0) score += 15;
      completionPercentage = Math.min(Math.round(score), 100);
    }

    const profile = {
      name: profileDoc?.fullName || 'Student',
      college: profileDoc?.college || 'University',
      degree: profileDoc?.degree || 'B.S.',
      graduationYear: profileDoc?.graduationYear || 2027,
      completionPercentage,
      targetRoles: profileDoc?.careerInterests?.targetRoles || ['Full-Stack Developer'],
      skillsCount: profileDoc?.skills?.length || 0,
    };

    // 2. Career Analysis & Skill Gaps
    let careerAnalysis: DashboardMetricSummary['careerAnalysis'] = {
      hasAnalysis: false,
    };
    let skillGaps: DashboardMetricSummary['skillGaps'] = [];

    if (careerAnalysisDoc) {
      const critCount = (careerAnalysisDoc.missingSkills || []).filter(
        (s) => s.importance === 'critical'
      ).length;
      const recCount = (careerAnalysisDoc.missingSkills || []).filter(
        (s) => s.importance === 'recommended'
      ).length;

      careerAnalysis = {
        hasAnalysis: true,
        targetRole: careerAnalysisDoc.targetRole?.title,
        readinessScore: careerAnalysisDoc.scores?.readinessScore ?? 0,
        suitabilityLevel: careerAnalysisDoc.scores?.suitabilityLevel ?? 'Moderate Match',
        topStrengths: (careerAnalysisDoc.strengths || []).slice(0, 3),
        criticalGapsCount: critCount,
        recommendedGapsCount: recCount,
        analyzedAt: careerAnalysisDoc.createdAt,
      };

      skillGaps = (careerAnalysisDoc.missingSkills || []).slice(0, 6).map((s) => ({
        name: s.name,
        category: s.category,
        requiredLevel: s.requiredLevel,
        importance: s.importance,
        estimatedHours: s.estimatedHours,
      }));
    }

    // 3. Learning Roadmap Progress
    let roadmap: DashboardMetricSummary['roadmap'] = {
      hasRoadmap: false,
    };

    if (roadmapDoc) {
      const upcoming = roadmapDoc.phases
        .flatMap((p) => p.weeks.flatMap((w) => w.tasks))
        .filter((t) => !t.completed)
        .slice(0, 4)
        .map((t) => ({
          _id: t._id ? t._id.toString() : '',
          title: t.title,
          learningObjective: t.learningObjective,
          estimatedMinutes: t.estimatedMinutes,
          type: t.type,
        }));

      roadmap = {
        hasRoadmap: true,
        targetRole: roadmapDoc.targetRole?.title,
        totalTasks: roadmapDoc.totalTasks,
        completedTasks: roadmapDoc.completedTasks,
        overallProgress: roadmapDoc.overallProgress,
        weeklyHours: roadmapDoc.weeklyHours,
        totalWeeks: roadmapDoc.totalWeeks,
        upcomingTasks: upcoming,
      };
    }

    // 4. Saved Jobs
    const savedJobsList = savedJobsDocs
      .map((s) => {
        const opp = s.job as unknown as {
          _id?: Types.ObjectId;
          title?: string;
          company?: string;
          location?: string;
          employmentType?: string;
        } | null;
        if (!opp) return null;
        return {
          id: opp._id ? opp._id.toString() : s._id.toString(),
          title: opp.title || 'Position',
          company: opp.company || 'Company',
          location: opp.location || 'Remote',
          employmentType: opp.employmentType || 'Full-time',
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const jobs = {
      totalSaved: savedJobsList.length,
      savedJobs: savedJobsList.slice(0, 4),
    };

    // 5. Application Pipeline & Response Rate
    let saved = 0;
    let applied = 0;
    let assessment = 0;
    let interview = 0;
    let offer = 0;
    let rejected = 0;
    let withdrawn = 0;

    const upcomingInterviews: DashboardMetricSummary['upcomingInterviews'] = [];
    const overdueFollowUps: DashboardMetricSummary['pendingFollowUps']['overdue'] = [];
    const upcomingFollowUps: DashboardMetricSummary['pendingFollowUps']['upcoming'] = [];

    for (const app of applicationsDocs as unknown as IJobApplication[]) {
      switch (app.status) {
        case 'Saved':
          saved++;
          break;
        case 'Applied':
          applied++;
          break;
        case 'Assessment':
          assessment++;
          break;
        case 'Interview':
          interview++;
          break;
        case 'Offer':
          offer++;
          break;
        case 'Rejected':
          rejected++;
          break;
        case 'Withdrawn':
          withdrawn++;
          break;
      }

      // Upcoming interviews check
      if (
        app.interviewDate &&
        new Date(app.interviewDate) >= startOfToday &&
        !['Rejected', 'Withdrawn'].includes(app.status)
      ) {
        upcomingInterviews.push({
          id: app._id.toString(),
          company: app.company,
          jobTitle: app.jobTitle,
          interviewDate: new Date(app.interviewDate),
          location: app.location || 'Remote',
          notes: app.notes,
        });
      }

      // Pending follow-ups check
      if (
        app.followUpDate &&
        ['Applied', 'Assessment', 'Interview'].includes(app.status)
      ) {
        const followUpTime = new Date(app.followUpDate);
        if (followUpTime < startOfToday) {
          overdueFollowUps.push({
            id: app._id.toString(),
            company: app.company,
            jobTitle: app.jobTitle,
            followUpDate: followUpTime,
            status: app.status,
          });
        } else if (followUpTime <= sevenDaysFromNow) {
          upcomingFollowUps.push({
            id: app._id.toString(),
            company: app.company,
            jobTitle: app.jobTitle,
            followUpDate: followUpTime,
            status: app.status,
          });
        }
      }
    }

    // Sort upcoming interviews by earliest date
    upcomingInterviews.sort((a, b) => a.interviewDate.getTime() - b.interviewDate.getTime());

    const activePipelineCount = applied + assessment + interview;
    const nonSavedCount = applicationsDocs.length - saved;
    const respondedCount = assessment + interview + offer;
    const responseRatePercentage =
      nonSavedCount > 0 ? Math.round((respondedCount / nonSavedCount) * 100) : 0;

    const applications = {
      totalApplications: applicationsDocs.length,
      activePipelineCount,
      responseRatePercentage,
      stageCounts: {
        saved,
        applied,
        assessment,
        interview,
        offer,
        rejected,
        withdrawn,
      },
    };

    const pendingFollowUps = {
      overdueCount: overdueFollowUps.length,
      overdue: overdueFollowUps,
      upcomingCount: upcomingFollowUps.length,
      upcoming: upcomingFollowUps,
    };

    // 6. Recent Mock Interview Practice Sessions
    const recentInterviewPractice = interviewSessionsDocs.map((s) => ({
      id: s._id.toString(),
      targetRole: s.targetRole,
      interviewType: s.interviewType,
      difficulty: s.difficulty,
      score: s.summary?.overallScore ?? 0,
      completedAt: s.completedAt || s.createdAt,
      answeredCount: s.questions.filter((q) => q.studentAnswer).length,
      totalQuestions: s.totalQuestions,
    }));

    // 7. Resume Analysis
    let resumeAnalysis: DashboardMetricSummary['resumeAnalysis'] = {
      hasAnalysis: false,
    };

    if (resumeAnalysisDoc) {
      resumeAnalysis = {
        hasAnalysis: true,
        targetJobTitle: resumeAnalysisDoc.targetJobTitle,
        overallScore: resumeAnalysisDoc.scores?.overallScore ?? 0,
        missingKeywordsCount: resumeAnalysisDoc.missingKeywords?.length || 0,
        matchedKeywordsCount: resumeAnalysisDoc.matchedKeywords?.length || 0,
        analyzedAt: resumeAnalysisDoc.createdAt,
      };
    }

    // 8. Grounded Recommended Next Actions
    const recommendedNextActions: DashboardMetricSummary['recommendedNextActions'] = [];

    if (upcomingInterviews.length > 0) {
      recommendedNextActions.push({
        id: 'action_interview',
        priority: 'high',
        title: `Prepare for ${upcomingInterviews[0].company} Interview`,
        description: `Practice technical and behavioral screens scheduled for ${upcomingInterviews[0].interviewDate.toLocaleDateString()}.`,
        actionLabel: 'Open Mock Simulator',
        actionUrl: '/interview-prep',
      });
    }

    if (overdueFollowUps.length > 0) {
      recommendedNextActions.push({
        id: 'action_followup',
        priority: 'high',
        title: `Follow up with ${overdueFollowUps[0].company}`,
        description: `Your follow-up date for ${overdueFollowUps[0].jobTitle} has passed. Update reminder or send email.`,
        actionLabel: 'Review Applications',
        actionUrl: '/applications',
      });
    }

    if (!careerAnalysisDoc) {
      recommendedNextActions.push({
        id: 'action_analysis',
        priority: 'high',
        title: 'Run AI Career Analysis',
        description: 'Audit your existing skills against 100+ industry job roles to identify skill gaps.',
        actionLabel: 'Run Analysis',
        actionUrl: '/career-analysis',
      });
    } else if (skillGaps.length > 0 && !roadmapDoc) {
      recommendedNextActions.push({
        id: 'action_roadmap',
        priority: 'high',
        title: 'Generate Learning Roadmap',
        description: `Bridge ${skillGaps.length} identified skill gaps with a phased curriculum.`,
        actionLabel: 'Build Roadmap',
        actionUrl: '/roadmap',
      });
    }

    if (roadmapDoc && roadmap.upcomingTasks && roadmap.upcomingTasks.length > 0) {
      recommendedNextActions.push({
        id: 'action_task',
        priority: 'medium',
        title: `Continue Roadmap: ${roadmap.upcomingTasks[0].title}`,
        description: `Complete ${roadmap.upcomingTasks[0].estimatedMinutes}m task to advance curriculum progress.`,
        actionLabel: 'Open Task',
        actionUrl: '/roadmap',
      });
    }

    if (!resumeAnalysisDoc) {
      recommendedNextActions.push({
        id: 'action_resume',
        priority: 'medium',
        title: 'Upload Resume for ATS Audit',
        description: 'Check your PDF/DOCX resume against keyword requirements and ATS scoring.',
        actionLabel: 'Audit Resume',
        actionUrl: '/resume-analysis',
      });
    }

    if (savedJobsList.length > 0 && applicationsDocs.length === 0) {
      recommendedNextActions.push({
        id: 'action_apply',
        priority: 'low',
        title: `Apply to ${savedJobsList[0].company}`,
        description: `You have ${savedJobsList.length} bookmarked opportunities waiting in your pipeline.`,
        actionLabel: 'View Saved Jobs',
        actionUrl: '/jobs',
      });
    }

    return {
      profile,
      careerAnalysis,
      skillGaps,
      roadmap,
      jobs,
      applications,
      upcomingInterviews,
      pendingFollowUps,
      recentInterviewPractice,
      resumeAnalysis,
      recommendedNextActions: recommendedNextActions.slice(0, 4),
    };
  }
}

export const dashboardService = new DashboardService();
