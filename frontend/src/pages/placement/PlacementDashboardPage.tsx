import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Briefcase,
  Target,
  Award,
  Clock,
  Plus,
  RefreshCw,
  Building2,
  Calendar,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import { placementService } from '../../services/placement.service';
import { PlacementDashboardData } from '../../types/placement.types';
import { useToast } from '../../context/ToastContext';

export const PlacementDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const [data, setData] = useState<PlacementDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const result = await placementService.getDashboardMetrics();
      setData(result);
    } catch (err) {
      toastError('Placement Error', (err as Error).message || 'Failed to load placement metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Spinner size="lg" className="text-emerald-600 mb-3" />
        <p className="text-xs font-medium text-slate-500">Querying institutional placement metrics...</p>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalStudents: 0,
    completedProfiles: 0,
    completedAssessments: 0,
    placementReadyStudents: 0,
    nearlyReadyStudents: 0,
    activeDrivesCount: 0,
    totalCandidatesRegistered: 0,
    placementApplicationsCount: 0,
    studentsWithOffersCount: 0,
    pendingEligibilityReviews: 0,
    candidatesInInterview: 0,
  };

  const readinessPercentage =
    metrics.totalStudents > 0
      ? Math.round((metrics.placementReadyStudents / metrics.totalStudents) * 100)
      : 0;

  const placementRate =
    metrics.totalStudents > 0
      ? Math.round((metrics.studentsWithOffersCount / metrics.totalStudents) * 100)
      : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <Building2 className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {data?.institution.name || 'Placement Cell Dashboard'}
            </h1>
            <Badge variant="success" size="sm">
              {data?.institution.code || 'Campus'}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            College placement readiness, recruitment drives, candidate eligibility, and official hiring outcomes.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/placement/drives')}
            className="text-xs bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create Drive
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Students
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{metrics.totalStudents}</span>
            <span className="text-xs text-slate-400 ml-1.5">enrolled</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {metrics.completedProfiles} profiles completed (
            {metrics.totalStudents > 0
              ? Math.round((metrics.completedProfiles / metrics.totalStudents) * 100)
              : 0}
            %)
          </div>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Placement Ready
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{metrics.placementReadyStudents}</span>
            <span className="text-xs text-emerald-600 font-semibold ml-1.5">
              ({readinessPercentage}%)
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            +{metrics.nearlyReadyStudents} students nearly ready
          </div>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Drives
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{metrics.activeDrivesCount}</span>
            <span className="text-xs text-slate-400 ml-1.5">campaigns</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {metrics.totalCandidatesRegistered} candidate applications
          </div>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Offers Recorded
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{metrics.studentsWithOffersCount}</span>
            <span className="text-xs text-emerald-600 font-semibold ml-1.5">
              ({placementRate}% placed)
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {metrics.candidatesInInterview} in active interview stage
          </div>
        </Card>
      </div>

      {/* Main Grid: Upcoming Deadlines & Quick Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Active Drive Deadlines */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Upcoming Drive Deadlines & Recruitment Schedule
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Timelines for student registration, assessments, and campus interviews.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/placement/drives')}
                className="text-xs"
              >
                View All Drives
              </Button>
            </CardHeader>
            <CardContent>
              {data?.upcomingDeadlines && data.upcomingDeadlines.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {data.upcomingDeadlines.map((deadline) => (
                    <div
                      key={deadline.id}
                      onClick={() => navigate(`/placement/drives/${deadline.id}`)}
                      className="py-3.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {deadline.companyName}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-600">{deadline.driveTitle}</span>
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-slate-500">
                          <span className="flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            Closes: {new Date(deadline.registrationDeadline).toLocaleDateString()}
                          </span>
                          {deadline.assessmentDate && (
                            <span className="flex items-center">
                              <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                              Assessment: {new Date(deadline.assessmentDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2.5">
                        <Badge
                          variant={
                            deadline.status === 'registration_open'
                              ? 'success'
                              : deadline.status === 'published'
                              ? 'info'
                              : 'default'
                          }
                          size="sm"
                        >
                          {deadline.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <Briefcase className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-medium">No active recruitment drives currently scheduled</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Click &quot;Create Drive&quot; to launch an on-campus hiring campaign.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Attention Needed & Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">
                Action Items & Verification
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Pending administrative reviews for candidate eligibility.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold text-amber-900">
                    {metrics.pendingEligibilityReviews} Candidate(s) Need Review
                  </span>
                  <p className="text-amber-700 mt-0.5">
                    Unverified academic records or partial skill criteria require officer decision.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/placement/students')}
                  className="w-full justify-start text-xs text-slate-700"
                >
                  <Users className="w-4 h-4 mr-2 text-slate-500" />
                  Browse Student Directory
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/placement/readiness')}
                  className="w-full justify-start text-xs text-slate-700"
                >
                  <Target className="w-4 h-4 mr-2 text-slate-500" />
                  Placement Readiness Overview
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/placement/analytics')}
                  className="w-full justify-start text-xs text-slate-700"
                >
                  <TrendingUp className="w-4 h-4 mr-2 text-slate-500" />
                  View Department Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

