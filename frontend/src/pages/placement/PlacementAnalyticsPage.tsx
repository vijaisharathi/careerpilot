import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  Clock,
  Download,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  Code2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Spinner } from '../../components/common/Spinner';
import { placementService } from '../../services/placement.service';
import { codingService } from '../../services/coding.service';
import { PlacementAnalyticsData } from '../../types/placement.types';
import { useToast } from '../../context/ToastContext';

export const PlacementAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const [analytics, setAnalytics] = useState<PlacementAnalyticsData | null>(null);
  const [codingAnalytics, setCodingAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const data = await placementService.getAnalytics();
      setAnalytics(data);
      try {
        const cData = await codingService.getPlacementCodingAnalytics();
        setCodingAnalytics(cData);
      } catch {
        // Non-blocking if coding data not yet generated
      }
    } catch (err) {
      toastError('Failed to load placement analytics', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const blob = await placementService.exportCsv('students');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `placement_analytics_report_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toastSuccess('Export Complete', 'Institutional placement report exported to CSV.');
    } catch (err) {
      toastError('Export Failed', (err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Spinner size="lg" className="text-emerald-600 mb-3" />
        <p className="text-xs font-medium text-slate-500">Aggregating institutional placement data...</p>
      </div>
    );
  }

  const deptData = analytics?.departmentWise || [];
  const yearData = analytics?.graduationYearWise || [];
  const funnel = analytics?.funnelStages || {
    registered: 0,
    shortlisted: 0,
    assessment: 0,
    interview: 0,
    selected: 0,
    offered: 0,
    accepted: 0,
  };
  const topSkills = analytics?.topIdentifiedSkills || [];

  const totalPlaced = deptData.reduce((acc, d) => acc + d.placedCount, 0);
  const totalStudents = analytics?.totalStudents || 1;
  const overallRate = totalStudents > 0 ? Math.round((totalPlaced / totalStudents) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Placement Analytics & Outcomes
            </h1>
            <Badge variant="primary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              {analytics?.institution.name || 'Institution Scope'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Real-time conversion metrics, department placement rates, candidate recruitment funnel, and institutional skill coverage.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={exporting}
            className="flex items-center gap-2 border-slate-300 text-slate-700"
          >
            {exporting ? <Spinner size="sm" /> : <Download className="h-4 w-4" />}
            <span>Export Analytics CSV</span>
          </Button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Placement Rate</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{overallRate}%</h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Of registered student body</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Placed Candidates</p>
              <h3 className="text-2xl font-extrabold text-emerald-700 mt-1">{totalPlaced}</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Confirmed accepted offers</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Enrolled</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{totalStudents}</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Across all departments</p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-700">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Pipeline</p>
              <h3 className="text-2xl font-extrabold text-purple-700 mt-1">
                {funnel.interview + funnel.shortlisted + funnel.assessment}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Shortlist, test &amp; interview</p>
            </div>
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-700">
              <Layers className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recruitment Funnel Card */}
      <Card className="border border-slate-200/80 shadow-sm">
        <CardHeader className="py-4 px-6 border-b border-slate-100 bg-slate-50/40">
          <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-600" />
            <span>Recruitment Stage Conversion Funnel</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Real-time candidate progression across all on-campus recruitment cycles.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-xs font-semibold text-slate-500 uppercase">Registered</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{funnel.registered}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">100% of pipeline</div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-xs font-semibold text-blue-700 uppercase">Shortlisted</div>
              <div className="text-xl font-bold text-blue-900 mt-1">{funnel.shortlisted}</div>
              <div className="text-[10px] text-blue-600 mt-0.5">
                {funnel.registered > 0 ? Math.round((funnel.shortlisted / funnel.registered) * 100) : 0}% of reg.
              </div>
            </div>

            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="text-xs font-semibold text-indigo-700 uppercase">Assessment</div>
              <div className="text-xl font-bold text-indigo-900 mt-1">{funnel.assessment}</div>
              <div className="text-[10px] text-indigo-600 mt-0.5">
                {funnel.registered > 0 ? Math.round((funnel.assessment / funnel.registered) * 100) : 0}% of reg.
              </div>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-xs font-semibold text-purple-700 uppercase">Interview</div>
              <div className="text-xl font-bold text-purple-900 mt-1">{funnel.interview}</div>
              <div className="text-[10px] text-purple-600 mt-0.5">
                {funnel.registered > 0 ? Math.round((funnel.interview / funnel.registered) * 100) : 0}% of reg.
              </div>
            </div>

            <div className="p-3 bg-sky-50 rounded-lg border border-sky-200">
              <div className="text-xs font-semibold text-sky-700 uppercase">Selected</div>
              <div className="text-xl font-bold text-sky-900 mt-1">{funnel.selected}</div>
              <div className="text-[10px] text-sky-600 mt-0.5">Final shortlist</div>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="text-xs font-semibold text-amber-700 uppercase">Offered</div>
              <div className="text-xl font-bold text-amber-900 mt-1">{funnel.offered}</div>
              <div className="text-[10px] text-amber-600 mt-0.5">Letters extended</div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="text-xs font-semibold text-emerald-700 uppercase">Accepted</div>
              <div className="text-xl font-bold text-emerald-900 mt-1">{funnel.accepted}</div>
              <div className="text-[10px] text-emerald-600 mt-0.5">Confirmed Placed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid: Department Wise & Skills Coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department-wise Placement Rates */}
        <Card className="border border-slate-200/80 shadow-sm overflow-hidden">
          <CardHeader className="py-4 px-6 border-b border-slate-100 bg-slate-50/40">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-600" />
              <span>Department-wise Placement Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {deptData.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No department metrics available.</p>
            ) : (
              deptData.map((d, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">{d.department}</span>
                    <span className="text-slate-600">
                      <strong>{d.placedCount}</strong> of {d.totalStudents} placed ({d.placementRatePercentage}%)
                    </span>
                  </div>
                  <ProgressBar
                    value={d.placementRatePercentage}
                    variant={d.placementRatePercentage >= 70 ? 'success' : d.placementRatePercentage >= 40 ? 'primary' : 'warning'}
                    className="h-2"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>In-process: {d.inProcessCount}</span>
                    <span>Unplaced: {d.unplacedCount}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top Institutional Skills */}
        <Card className="border border-slate-200/80 shadow-sm overflow-hidden">
          <CardHeader className="py-4 px-6 border-b border-slate-100 bg-slate-50/40">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span>Institutional Skill Coverage</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3.5">
            {topSkills.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No skill aggregates available yet.</p>
            ) : (
              topSkills.map((sk, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{sk.skillName}</span>
                    <span className="text-slate-500">
                      {sk.studentCount} students ({sk.coveragePercentage}%)
                    </span>
                  </div>
                  <ProgressBar
                    value={sk.coveragePercentage}
                    variant="primary"
                    className="h-1.5"
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Institutional Technical Assessment & Coding Proficiency */}
      <Card className="border border-slate-200/80 shadow-sm overflow-hidden">
        <CardHeader className="py-4 px-6 border-b border-slate-100 bg-slate-50/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Code2 className="h-4 w-4 text-emerald-600" />
              <span>Institutional Technical Skill & Coding Assessment Performance</span>
            </CardTitle>
            {codingAnalytics && (
              <Badge variant="primary" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs">
                Avg Score: {codingAnalytics.averageCodingScore || 0}%
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs text-slate-500">
            Real performance evaluation across student algorithmic benchmark attempts, multi-language executions, and technical accuracy.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {!codingAnalytics || codingAnalytics.totalStudentsEvaluated === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              <Code2 className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p>No coding assessment attempts recorded yet across your institution.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stat summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Evaluated Students</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{codingAnalytics.totalStudentsEvaluated}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Average Coding Score</div>
                  <div className="text-2xl font-black text-emerald-600 mt-1">{codingAnalytics.averageCodingScore}%</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Identified Skill Gaps</div>
                  <div className="text-2xl font-black text-amber-600 mt-1">{codingAnalytics.commonSkillGaps?.length || 0}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Top Performer Count</div>
                  <div className="text-2xl font-black text-blue-600 mt-1">{codingAnalytics.topPerformers?.length || 0}</div>
                </div>
              </div>

              {/* Category Performance & Top Performers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                    Category Accuracy Rates
                  </h4>
                  <div className="space-y-2.5">
                    {codingAnalytics.categoryPerformance?.map((cat: any, idx: number) => (
                      <div key={idx} className="p-2.5 bg-slate-50/70 rounded border border-slate-100 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-slate-800 capitalize">{cat.category}</span>
                          <span className="text-slate-500">{cat.averageAccuracy}% avg accuracy ({cat.totalAttempts} runs)</span>
                        </div>
                        <ProgressBar value={cat.averageAccuracy} variant={cat.averageAccuracy >= 70 ? 'success' : 'primary'} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                    Top Institutional Coders
                  </h4>
                  <div className="space-y-2">
                    {codingAnalytics.topPerformers?.length ? (
                      codingAnalytics.topPerformers.map((tp: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50/70 rounded border border-slate-100 text-xs">
                          <div>
                            <span className="font-semibold text-slate-900">{tp.studentName}</span>
                            <span className="text-[10px] text-slate-400 ml-1.5">({tp.department})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">{tp.totalSolved} solved</span>
                            <Badge variant="primary" className="bg-emerald-50 text-emerald-800 border-emerald-200">
                              {tp.overallCodingScore}/100
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No performers recorded yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Graduation Year Breakdown */}
      {yearData.length > 0 && (
        <Card className="border border-slate-200/80 shadow-sm overflow-hidden">
          <CardHeader className="py-3.5 px-6 border-b border-slate-100 bg-slate-50/40">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-600" />
              <span>Graduation Cohort Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase">
                    <th className="py-3 px-4">Graduation Year</th>
                    <th className="py-3 px-4 text-center">Total Students</th>
                    <th className="py-3 px-4 text-center">Placed</th>
                    <th className="py-3 px-4 text-right">Placement Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {yearData.map((y, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-900">Class of {y.graduationYear}</td>
                      <td className="py-3 px-4 text-center">{y.totalStudents}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-700">{y.placedCount}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{y.placementRatePercentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

