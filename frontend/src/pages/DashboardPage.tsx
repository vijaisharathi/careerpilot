import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  BookOpen,
  Briefcase,
  Circle,
  Calendar,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Clock,
  Award,
  FileText,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { ProgressBar } from '../components/common/ProgressBar';
import { useStudentData } from '../context/StudentDataContext';
import { useToast } from '../context/ToastContext';
import { dashboardService } from '../services/dashboard.service';
import { DashboardMetricSummary } from '../types/dashboard.types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { toggleRoadmapTaskStatus } = useStudentData();
  const { success, error } = useToast();

  const [summary, setSummary] = useState<DashboardMetricSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadSummary = useCallback(async () => {
    try {
      const data = await dashboardService.getDashboardSummary();
      setSummary(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve dashboard metrics.';
      error('Dashboard Error', msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [error]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadSummary();
  };

  const handleToggleTask = async (e: React.MouseEvent, taskId: string, taskTitle: string) => {
    e.stopPropagation();
    try {
      await toggleRoadmapTaskStatus(taskId, true);
      success('Task Completed! 🎉', `"${taskTitle}" marked as complete.`);
      loadSummary();
    } catch {
      // toast will handle
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-12 animate-pulse">
        <div className="h-44 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-36 bg-slate-200 rounded-2xl" />
          <div className="h-36 bg-slate-200 rounded-2xl md:col-span-2" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 rounded-2xl" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const profile = summary?.profile;
  const career = summary?.careerAnalysis;
  const roadmap = summary?.roadmap;
  const applications = summary?.applications;
  const jobs = summary?.jobs;
  const interviews = summary?.upcomingInterviews || [];
  const followUps = summary?.pendingFollowUps;
  const practiceSessions = summary?.recentInterviewPractice || [];
  const resume = summary?.resumeAnalysis;
  const nextActions = summary?.recommendedNextActions || [];

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Student Welcome Section */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl shadow-indigo-950/20 flex flex-col md:flex-row md:items-center md:justify-between gap-6 border border-slate-800">
        <div className="space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5" /> Placement Season 2026-2027 Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {profile?.name || 'Student'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            {profile?.college || 'University'} &bull; {profile?.degree || 'Degree'} &bull; Class of{' '}
            {profile?.graduationYear || 2027} &bull; Target Role:{' '}
            <strong className="text-white">{profile?.targetRoles?.[0] || 'Software Engineer'}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
            onClick={handleRefresh}
            disabled={refreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
            onClick={() => navigate('/profile')}
          >
            Edit Profile
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs shadow-md shadow-indigo-600/30"
            onClick={() => navigate('/skill-gap')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Run Career Audit
          </Button>
        </div>
      </div>

      {/* 9. Overdue Follow-up Alert Banner (if any) */}
      {followUps && followUps.overdueCount > 0 && (
        <div
          onClick={() => navigate('/applications')}
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center justify-between cursor-pointer hover:bg-rose-100/80 transition-colors shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold">Follow-Up Overdue:</span> You have{' '}
              <strong>{followUps.overdueCount} application(s)</strong> awaiting response past your
              scheduled follow-up date ({followUps.overdue.map((f) => f.company).join(', ')}).
            </div>
          </div>
          <span className="font-semibold text-rose-700 underline shrink-0 ml-4">
            Review Applications &rarr;
          </span>
        </div>
      )}

      {/* Top Metric Row: Profile Completion + Career Readiness */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 2. Profile Completion */}
        <Card className="shadow-2xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Profile Completion
              </span>
              <Badge
                variant={
                  (profile?.completionPercentage ?? 0) >= 80
                    ? 'success'
                    : (profile?.completionPercentage ?? 0) >= 50
                    ? 'warning'
                    : 'info'
                }
                size="sm"
              >
                {profile?.completionPercentage ?? 0}%
              </Badge>
            </div>
            <CardTitle className="text-base">Student Readiness Portfolio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <ProgressBar value={profile?.completionPercentage ?? 0} size="md" variant="primary" />
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>{profile?.skillsCount || 0} skills cataloged</span>
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="font-semibold text-indigo-600 hover:underline"
              >
                Update Profile &rarr;
              </button>
            </div>
          </CardContent>
        </Card>

        {/* 3. Career Readiness Summary */}
        <Card className="shadow-2xs md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Career Readiness Index
              </span>
              {career?.hasAnalysis ? (
                <Badge
                  variant={
                    career.suitabilityLevel === 'High Match'
                      ? 'success'
                      : career.suitabilityLevel === 'Moderate Match'
                      ? 'warning'
                      : 'info'
                  }
                  size="sm"
                  dot
                >
                  {career.suitabilityLevel || 'Analyzed'}
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm">
                  Audit Pending
                </Badge>
              )}
            </div>
            <CardTitle className="text-base">
              {career?.targetRole || profile?.targetRoles?.[0] || 'Target Career Track'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {career?.hasAnalysis ? (
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xs text-slate-400">Readiness Score</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">
                    {career.readinessScore ?? 0} / 100
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium">Placement Benchmark</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xs text-slate-400">Critical Skill Deficits</div>
                  <div className="text-xl font-bold text-rose-600 mt-0.5">
                    {career.criticalGapsCount ?? 0}
                  </div>
                  <div className="text-[10px] text-rose-600 font-medium">High Priority</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xs text-slate-400">Recommended Gaps</div>
                  <div className="text-xl font-bold text-amber-600 mt-0.5">
                    {career.recommendedGapsCount ?? 0}
                  </div>
                  <div className="text-[10px] text-amber-600 font-medium">Elective Upgrades</div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                <p className="text-xs text-slate-500">
                  No career analysis recorded for your target role yet. Generate your personalized fit
                  scores.
                </p>
                <Button size="sm" variant="primary" onClick={() => navigate('/career-analysis')}>
                  Run Career Role Analysis
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Skill Gap Overview & Learning Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 4. Skill-Gap Overview */}
        <Card className="shadow-2xs flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Skill-Gap Overview</CardTitle>
              <CardDescription>
                High-priority competency requirements for {career?.targetRole || 'your target role'}
              </CardDescription>
            </div>
            <Link to="/skill-gap" className="text-xs font-semibold text-indigo-600 hover:underline">
              Inspect Matrix
            </Link>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {summary?.skillGaps && summary.skillGaps.length > 0 ? (
              summary.skillGaps.slice(0, 4).map((gap, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900">{gap.name}</span>
                    <Badge variant={gap.importance === 'critical' ? 'danger' : 'warning'} size="sm">
                      {gap.importance === 'critical' ? 'Critical Deficit' : 'Recommended'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Required proficiency: {gap.requiredLevel} &bull; Estimated bridge time: ~
                    {gap.estimatedHours} hrs
                  </p>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                No active skill deficits recorded. Run an audit to uncover target competency gaps.
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => navigate('/skill-gap')}
            >
              View Full Skill Gap Matrix
            </Button>
          </CardFooter>
        </Card>

        {/* 5. Learning Roadmap Completion */}
        <Card className="shadow-2xs flex flex-col justify-between">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <CardTitle className="text-base">
                  Curriculum: {roadmap?.targetRole || 'Personalized Roadmap'}
                </CardTitle>
              </div>
              <CardDescription>
                {roadmap?.hasRoadmap
                  ? `${roadmap.weeklyHours || 10} hrs/week pace \u2022 ${roadmap.totalWeeks || 8} Weeks Plan`
                  : 'Actionable study plan structured from identified skill deficits'}
              </CardDescription>
            </div>
            {roadmap?.hasRoadmap && (
              <span className="text-xs font-semibold text-slate-600 font-mono">
                {roadmap.completedTasks}/{roadmap.totalTasks} Tasks ({roadmap.overallProgress}%)
              </span>
            )}
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {roadmap?.hasRoadmap ? (
              <>
                <ProgressBar
                  value={roadmap.overallProgress || 0}
                  size="md"
                  variant="primary"
                  showValue
                />
                {roadmap.upcomingTasks && roadmap.upcomingTasks.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Next In Curriculum</span>
                      <span className="text-[11px] text-indigo-600 font-normal">Click circle to complete</span>
                    </div>
                    {roadmap.upcomingTasks.slice(0, 3).map((task) => (
                      <div
                        key={task._id}
                        onClick={() => navigate('/roadmap')}
                        className="p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 shadow-2xs text-xs cursor-pointer transition-all flex items-center justify-between gap-3"
                      >
                        <div className="truncate">
                          <span className="font-bold text-slate-900 block truncate">{task.title}</span>
                          <span className="text-[11px] text-slate-500 block truncate">
                            {task.learningObjective}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono text-slate-400">
                            {task.estimatedMinutes}m
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleToggleTask(e, task._id, task.title)}
                            className="p-1 text-slate-300 hover:text-emerald-600 transition-colors"
                            title="Mark complete"
                          >
                            <Circle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs text-center font-medium">
                    🎉 All tasks in your current sprint are completed! Keep your streak going.
                  </div>
                )}
              </>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl space-y-2">
                <p>No active learning roadmap generated yet.</p>
                <Button size="sm" variant="primary" onClick={() => navigate('/roadmap')}>
                  Generate Personalized Roadmap
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => navigate('/roadmap')}
            >
              Open Full Learning Roadmap
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* 7. Application Pipeline Breakdown (All 7 Statuses) */}
      <Card className="shadow-2xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3">
          <div>
            <CardTitle className="text-base">Application Tracker & Pipeline Metrics</CardTitle>
            <CardDescription>
              Comprehensive breakdown across all 7 stages with authentic response rate calculation
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700">
              Response Rate:{' '}
              <strong className="text-indigo-600 font-mono">
                {applications?.responseRatePercentage ?? 0}%
              </strong>
            </span>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate('/applications')}>
              Manage Board
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
            {[
              { label: 'Saved', count: applications?.stageCounts?.saved ?? 0, color: 'text-slate-700 bg-slate-50 border-slate-200' },
              { label: 'Applied', count: applications?.stageCounts?.applied ?? 0, color: 'text-sky-700 bg-sky-50 border-sky-200' },
              { label: 'Assessment', count: applications?.stageCounts?.assessment ?? 0, color: 'text-amber-700 bg-amber-50 border-amber-200' },
              { label: 'Interview', count: applications?.stageCounts?.interview ?? 0, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
              { label: 'Offer', count: applications?.stageCounts?.offer ?? 0, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
              { label: 'Rejected', count: applications?.stageCounts?.rejected ?? 0, color: 'text-rose-700 bg-rose-50 border-rose-200' },
              { label: 'Withdrawn', count: applications?.stageCounts?.withdrawn ?? 0, color: 'text-slate-600 bg-slate-50 border-slate-200' },
            ].map((stage, idx) => (
              <div
                key={idx}
                onClick={() => navigate('/applications')}
                className={`p-3 rounded-xl border ${stage.color} cursor-pointer hover:shadow-2xs transition-all`}
              >
                <div className="text-[11px] font-semibold uppercase tracking-wider">{stage.label}</div>
                <div className="text-xl font-bold mt-1">{stage.count}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Row 4: Upcoming Interviews, Recent Practice, Resume Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 8. Upcoming Interviews Widget */}
        <Card className="shadow-2xs border-amber-200/80 bg-amber-50/20 flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Upcoming Interviews</span>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {interviews.length > 0 ? (
              interviews.slice(0, 2).map((inv) => (
                <div
                  key={inv.id}
                  className="p-3.5 rounded-xl bg-white border border-amber-200 text-xs space-y-1.5 shadow-2xs"
                >
                  <div className="font-bold text-slate-900 text-sm">{inv.company}</div>
                  <div className="text-slate-600">{inv.jobTitle}</div>
                  <div className="text-amber-700 font-medium flex items-center gap-1 text-[11px]">
                    <Clock className="w-3.5 h-3.5" />{' '}
                    {new Date(inv.interviewDate).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </div>
                  {inv.notes && (
                    <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      Notes: {inv.notes}
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="primary"
                    className="w-full mt-2 text-xs"
                    onClick={() => navigate('/interview-prep')}
                  >
                    Launch Interview Practice
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 py-6 text-center">
                No upcoming interviews scheduled.
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => navigate('/applications')}
            >
              View Application Dates
            </Button>
          </CardFooter>
        </Card>

        {/* 10. Recent Interview Practice Sessions */}
        <Card className="shadow-2xs flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                <CardTitle className="text-base">Interview Practice</CardTitle>
              </div>
              <Link to="/interview-prep" className="text-xs font-semibold text-indigo-600 hover:underline">
                Practice
              </Link>
            </div>
            <CardDescription>Recent mock AI assessment scores</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-2.5">
            {practiceSessions.length > 0 ? (
              practiceSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => navigate('/interview-prep')}
                  className="p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 shadow-2xs text-xs cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-900">{session.targetRole}</div>
                    <div className="text-[11px] text-slate-500">
                      {session.interviewType.toUpperCase()} &bull; {session.difficulty}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-indigo-600">{session.score}%</div>
                    <div className="text-[10px] text-slate-400">
                      {session.answeredCount}/{session.totalQuestions} Qs
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 py-6 text-center">
                No practice interview sessions completed yet.
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => navigate('/interview-prep')}
            >
              Start New Mock Interview
            </Button>
          </CardFooter>
        </Card>

        {/* 11. Resume-Analysis Summary */}
        <Card className="shadow-2xs flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <CardTitle className="text-base">Resume ATS Audit</CardTitle>
              </div>
              <Link to="/resume-analysis" className="text-xs font-semibold text-indigo-600 hover:underline">
                Analyze
              </Link>
            </div>
            <CardDescription>Keyword alignment against job descriptions</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {resume?.hasAnalysis ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-600">Overall ATS Score</span>
                  <span className="text-lg font-bold text-emerald-600">{resume.overallScore}%</span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>
                    Target Job:{' '}
                    <strong className="text-slate-800">{resume.targetJobTitle || 'General'}</strong>
                  </div>
                  <div className="text-rose-600">
                    Missing Keywords: {resume.missingKeywordsCount ?? 0} terms
                  </div>
                  <div className="text-emerald-700">
                    Matched Keywords: {resume.matchedKeywordsCount ?? 0} terms
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-6 text-center">
                No resume ATS evaluation on record.
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => navigate('/resume-analysis')}
            >
              Inspect ATS Recommendations
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Row 5: 6. Saved Jobs & 12. Recommended Next Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 6. Saved Jobs and Opportunities */}
        <Card className="shadow-2xs flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Saved Opportunities ({jobs?.totalSaved || 0})</CardTitle>
              <CardDescription>Curated roles ready for application</CardDescription>
            </div>
            <Link to="/jobs" className="text-xs font-semibold text-indigo-600 hover:underline">
              Explore All Jobs
            </Link>
          </CardHeader>
          <CardContent className="pt-0 space-y-2.5">
            {jobs?.savedJobs && jobs.savedJobs.length > 0 ? (
              jobs.savedJobs.slice(0, 3).map((job) => (
                <div
                  key={job.id}
                  onClick={() => navigate('/jobs')}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs flex items-center justify-between gap-3 cursor-pointer transition-all"
                >
                  <div className="truncate">
                    <div className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                      {job.title}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {job.company} &bull; {job.location} &bull; {job.employmentType}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 py-6 text-center">
                No saved jobs yet. Browse vacancies and save opportunities for later.
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              variant="primary"
              size="sm"
              className="w-full text-xs"
              onClick={() => navigate('/jobs')}
              leftIcon={<Briefcase className="w-3.5 h-3.5" />}
            >
              Discover Verified Openings
            </Button>
          </CardFooter>
        </Card>

        {/* 12. Recommended Next Actions */}
        <Card className="shadow-2xs flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-600" />
              <CardTitle className="text-base">Prioritized Next Actions</CardTitle>
            </div>
            <CardDescription>
              Tailored high-impact activities synthesized from your active profile state
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-2.5">
            {nextActions.length > 0 ? (
              nextActions.map((action) => (
                <div
                  key={action.id}
                  onClick={() => navigate(action.actionUrl)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all cursor-pointer flex items-center justify-between text-xs text-slate-800"
                >
                  <div className="space-y-0.5 pr-2">
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      <span>{action.title}</span>
                      <Badge
                        variant={
                          action.priority === 'high'
                            ? 'danger'
                            : action.priority === 'medium'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {action.priority}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{action.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 text-xs py-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(action.actionUrl);
                    }}
                    rightIcon={<ArrowRight className="w-3 h-3" />}
                  >
                    {action.actionLabel}
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 py-6 text-center">
                All high-priority milestones are completed!
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => navigate('/ai-assistant')}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
            >
              Ask AI Career Assistant for Next Steps
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
