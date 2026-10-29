import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Users,
  ArrowRight,
  Filter,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/FormControls';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Spinner } from '../../components/common/Spinner';
import { placementService } from '../../services/placement.service';
import { PlacementStudentSummary } from '../../types/placement.types';
import { useToast } from '../../context/ToastContext';

export const PlacementReadinessPage: React.FC = () => {
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const [students, setStudents] = useState<PlacementStudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCohort, setSelectedCohort] = useState<'all' | 'Nearly Ready' | 'Needs Preparation' | 'Ready'>('Nearly Ready');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await placementService.getStudents({
        page: 1,
        limit: 50,
        readinessCategory: selectedCohort !== 'all' ? selectedCohort : undefined,
        department: departmentFilter !== 'all' ? departmentFilter : undefined,
      });
      setStudents(data.students);
    } catch (err) {
      toastError('Failed to load readiness cohort', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [selectedCohort, departmentFilter, toastError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Placement Readiness Hub
            </h1>
            <Badge variant="primary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              Deterministic Engine
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Transparent scoring and intervention pipeline: identify student cohorts needing specific preparation to become placement-eligible.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/placement/students')}
            className="flex items-center gap-2 text-slate-700"
          >
            <Users className="h-4 w-4" />
            <span>Full Directory</span>
          </Button>
        </div>
      </div>

      {/* Deterministic Scoring Engine Explainer */}
      <Card className="border border-emerald-200/60 bg-emerald-50/20 shadow-sm">
        <CardHeader className="py-4 px-6 border-b border-emerald-100">
          <CardTitle className="text-sm font-bold text-emerald-950 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            <span>Explainable 100-Point Institutional Readiness Model</span>
          </CardTitle>
          <CardDescription className="text-xs text-emerald-800">
            Scores are computed algorithmically from actual student activity. No opaque or hallucinated AI scores.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-3.5 bg-white rounded-lg border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700">Profile Completeness</span>
                <span className="text-xs font-bold text-emerald-700">25 pts</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Profile completion &gt;= 70%, valid degree, department, batch, and career goals.
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-lg border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700">Technical Skills</span>
                <span className="text-xs font-bold text-emerald-700">25 pts</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                At least 3 verified technical skills added with proficiency levels.
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-lg border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700">Career Assessment</span>
                <span className="text-xs font-bold text-emerald-700">20 pts</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Completion of comprehensive career analysis &amp; skill-gap assessment.
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-lg border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700">Resume Readiness</span>
                <span className="text-xs font-bold text-emerald-700">15 pts</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Generated or analyzed resume with quality feedback score &gt;= 60.
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-lg border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700">Mock Interviews</span>
                <span className="text-xs font-bold text-emerald-700">15 pts</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Completion of at least one technical or HR practice interview session.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cohort Tabs & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={selectedCohort === 'Nearly Ready' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedCohort('Nearly Ready')}
            className={`text-xs font-semibold ${
              selectedCohort === 'Nearly Ready'
                ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
                : 'text-slate-700'
            }`}
          >
            <Zap className="h-3.5 w-3.5 mr-1" />
            <span>High Priority Intervention: Nearly Ready (50-74)</span>
          </Button>

          <Button
            variant={selectedCohort === 'Needs Preparation' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedCohort('Needs Preparation')}
            className="text-xs font-semibold"
          >
            <span>Needs Prep (25-49)</span>
          </Button>

          <Button
            variant={selectedCohort === 'Ready' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedCohort('Ready')}
            className={`text-xs font-semibold ${
              selectedCohort === 'Ready'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                : 'text-slate-700'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            <span>Placement Ready (&gt;= 75)</span>
          </Button>
        </div>

        <div className="w-56">
          <Select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-xs"
          >
            <option value="all">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Electronics & Communication">Electronics & Comm.</option>
            <option value="Electrical Engineering">Electrical Eng.</option>
            <option value="Mechanical Engineering">Mechanical Eng.</option>
          </Select>
        </div>
      </div>

      {/* Intervention Candidate Table */}
      <Card className="border border-slate-200/80 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-200/80 py-3.5 px-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900">
                Cohort Candidates ({students.length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Candidates requiring targeted guidance to complete placement eligibility milestones.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Spinner size="lg" className="text-emerald-600 mb-3" />
              <p className="text-xs font-medium text-slate-500">Evaluating student cohorts...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Award className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-semibold text-slate-900">No candidates in this cohort</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No students currently match the selected cohort and department filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Department & Batch</th>
                    <th className="py-3 px-4 text-center">Profile %</th>
                    <th className="py-3 px-4">Readiness Category</th>
                    <th className="py-3 px-4">Top Verified Skills</th>
                    <th className="py-3 px-4 text-right">Intervention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{student.fullName}</div>
                        <div className="text-[11px] text-slate-400">{student.email}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{student.department}</div>
                        <div className="text-[11px] text-slate-400">Class of {student.graduationYear || 'N/A'}</div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-semibold ${
                            student.completionPercentage >= 70
                              ? 'text-emerald-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {student.completionPercentage}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            student.readinessCategory === 'Ready'
                              ? 'success'
                              : student.readinessCategory === 'Nearly Ready'
                              ? 'warning'
                              : 'secondary'
                          }
                        >
                          {student.readinessCategory}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {student.topSkills && student.topSkills.length > 0 ? (
                            student.topSkills.map((sk, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium"
                              >
                                {sk}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No skills listed</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/placement/students/${student.id}`)}
                          className="text-xs h-7 px-2.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                        >
                          <span>Review Dossier</span>
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

