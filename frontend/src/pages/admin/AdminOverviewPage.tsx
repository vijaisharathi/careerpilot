import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Briefcase,
  GraduationCap,
  Sparkles,
  RefreshCw,
  FileText,
  Map,
  Compass,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Server,
  Plus,
  BookOpen,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import { adminService } from '../../services/admin.service';
import { AdminOverviewMetrics } from '../../types/admin.types';
import { useToast } from '../../context/ToastContext';

export const AdminOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const [metrics, setMetrics] = useState<AdminOverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMetrics = useCallback(async () => {
    try {
      const data = await adminService.getOverview();
      setMetrics(data);
    } catch (err) {
      toastError('Dashboard Error', (err as Error).message || 'Failed to retrieve overview statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadMetrics();
  };

  if (loading && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Spinner size="lg" className="text-indigo-600 mb-3" />
        <p className="text-sm font-medium text-slate-500">Loading platform statistics...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Students',
      value: metrics?.totalStudents ?? 0,
      subtext: `${metrics?.activeStudents ?? 0} active • ${metrics?.suspendedStudents ?? 0} suspended`,
      icon: Users,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      title: 'New Registrations (30d)',
      value: metrics?.newRegistrationsLast30Days ?? 0,
      subtext: 'Verified student onboarding',
      icon: GraduationCap,
      color: 'text-sky-600 bg-sky-50 border-sky-100',
    },
    {
      title: 'Placement Listings',
      value: (metrics?.totalJobs ?? 0) + (metrics?.totalInternships ?? 0),
      subtext: `${metrics?.totalJobs ?? 0} Jobs • ${metrics?.totalInternships ?? 0} Internships`,
      icon: Briefcase,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Career Analyses',
      value: metrics?.careerAnalysesCompleted ?? 0,
      subtext: 'Completed role suitability audits',
      icon: Compass,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      title: 'Learning Roadmaps',
      value: metrics?.roadmapsGenerated ?? 0,
      subtext: 'Skill-gap action plans created',
      icon: Map,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
    },
    {
      title: 'Resumes Created',
      value: metrics?.resumesCreated ?? 0,
      subtext: 'Profile-populated drafts & variants',
      icon: FileText,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
    },
    {
      title: 'Mock Interviews',
      value: metrics?.mockInterviewsCompleted ?? 0,
      subtext: 'Criteria-evaluated sessions',
      icon: Sparkles,
      color: 'text-teal-600 bg-teal-50 border-teal-100',
    },
    {
      title: 'Applications Tracked',
      value: metrics?.applicationsTracked ?? 0,
      subtext: 'Active placement pipelines',
      icon: CheckCircle2,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Platform Administration Overview</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time aggregate platform metrics synthesized directly from verified database records.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Metrics</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/admin/jobs')}
            className="flex items-center"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            <span>Post Opportunity</span>
          </Button>
        </div>
      </div>

      {/* System Health Banner */}
      <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/60 via-white to-slate-50">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-800">Platform Core Engine</h3>
                <Badge variant="success" size="sm">
                  Healthy
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                AI Provider: <span className="font-semibold text-slate-700 capitalize">{metrics?.systemHealth.aiProvider}</span>{' '}
                {metrics?.systemHealth.aiSimulated && '(Deterministic Simulation Mode)'} • MongoDB: <span className="font-semibold text-slate-700">Connected</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/ai-monitoring')}
              className="text-xs"
            >
              Inspect AI Engine
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/audit-logs')}
              className="text-xs"
            >
              View Audit Trail
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card key={idx} className="hover:shadow-md transition-shadow duration-150">
              <CardContent className="p-5 flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{card.title}</p>
                  <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{card.value}</p>
                  <p className="text-xs text-slate-500 mt-1.5">{card.subtext}</p>
                </div>
                <div className={`p-2.5 rounded-lg border shrink-0 ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Action Hub & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Management Hub */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Administrative Quick Actions</CardTitle>
            <CardDescription className="text-xs">Direct navigation to high-frequency management tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <button
              onClick={() => navigate('/admin/students')}
              className="w-full p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-all flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3">
                <Users className="w-4 h-4 text-indigo-600" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Student Directory</p>
                  <p className="text-[11px] text-slate-500">Filter students and review readiness</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </button>

            <button
              onClick={() => navigate('/admin/jobs')}
              className="w-full p-3 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition-all flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Manage Postings</p>
                  <p className="text-[11px] text-slate-500">Publish, expire, and edit vacancies</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </button>

            <button
              onClick={() => navigate('/admin/career-roles')}
              className="w-full p-3 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50/40 text-left transition-all flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3">
                <Compass className="w-4 h-4 text-amber-600" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Role Catalog</p>
                  <p className="text-[11px] text-slate-500">Define required skills and benchmarks</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors" />
            </button>

            <button
              onClick={() => navigate('/admin/learning-resources')}
              className="w-full p-3 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 text-left transition-all flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3">
                <BookOpen className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Learning Catalog</p>
                  <p className="text-[11px] text-slate-500">Curate verified documentation guides</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 transition-colors" />
            </button>
          </CardContent>
        </Card>

        {/* Recent Platform Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm">Recent Audit Activities</CardTitle>
              <CardDescription className="text-xs">Security and administrative events recorded on the platform</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/audit-logs')}
              className="text-xs"
            >
              View All Logs
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {metrics?.recentActivities && metrics.recentActivities.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {metrics.recentActivities.map((act) => (
                  <div key={act.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                      <div className="truncate">
                        <p className="font-semibold text-slate-800 truncate">{act.action}</p>
                        <p className="text-[11px] text-slate-400">
                          by <span className="text-slate-600 font-medium">{act.actorEmail}</span> •{' '}
                          {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <Badge variant={act.status === 'success' ? 'success' : 'danger'} size="sm">
                      {act.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No administrative activity logged yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
