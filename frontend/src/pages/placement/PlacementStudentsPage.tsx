import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  GraduationCap,
  Download,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Award,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input, Select } from '../../components/common/FormControls';
import { Spinner } from '../../components/common/Spinner';
import { placementService } from '../../services/placement.service';
import { PlacementStudentSummary } from '../../types/placement.types';
import { useToast } from '../../context/ToastContext';

export const PlacementStudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const [students, setStudents] = useState<PlacementStudentSummary[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [readinessFilter, setReadinessFilter] = useState('all');
  const [placementStatusFilter, setPlacementStatusFilter] = useState('all');
  const [gradYearFilter, setGradYearFilter] = useState<number | undefined>(undefined);

  const loadStudents = useCallback(
    async (pageToLoad = 1) => {
      setLoading(true);
      try {
        const data = await placementService.getStudents({
          page: pageToLoad,
          limit: 10,
          search: searchQuery.trim() || undefined,
          department: departmentFilter !== 'all' ? departmentFilter : undefined,
          graduationYear: gradYearFilter,
          readinessCategory: readinessFilter !== 'all' ? readinessFilter : undefined,
          placementStatus: placementStatusFilter !== 'all' ? placementStatusFilter : undefined,
        });
        setStudents(data.students);
        setPagination(data.pagination);
      } catch (err) {
        toastError('Failed to load students', (err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, departmentFilter, gradYearFilter, readinessFilter, placementStatusFilter, toastError]
  );

  useEffect(() => {
    loadStudents(1);
  }, [loadStudents]);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const blob = await placementService.exportCsv('students');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `placement_students_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toastSuccess('Export Complete', 'Student placement directory exported securely to CSV.');
    } catch (err) {
      toastError('Export Failed', (err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const getReadinessBadge = (category: string) => {
    switch (category) {
      case 'Ready':
        return <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200">Ready</Badge>;
      case 'Nearly Ready':
        return <Badge variant="warning" className="bg-amber-50 text-amber-700 border-amber-200">Nearly Ready</Badge>;
      case 'Needs Preparation':
        return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">Needs Prep</Badge>;
      case 'Insufficient Data':
      default:
        return <Badge variant="default" className="bg-slate-100 text-slate-600 border-slate-200">Insufficient Data</Badge>;
    }
  };

  const getPlacementBadge = (status: string) => {
    switch (status) {
      case 'placed':
        return <Badge variant="success" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold">Placed</Badge>;
      case 'in_process':
        return <Badge variant="warning" className="bg-sky-50 text-sky-800 border-sky-300 font-semibold">In Process</Badge>;
      case 'unplaced':
      default:
        return <Badge variant="default" className="bg-slate-100 text-slate-600 border-slate-200">Unplaced</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Student Placement Directory</h1>
            <Badge variant="primary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              Institutional Scope
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Inspect placement readiness, profile completeness, verified skillsets, and candidate dossiers across your institution.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={exporting}
            className="flex items-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            {exporting ? <Spinner size="sm" /> : <Download className="h-4 w-4" />}
            <span>Export CSV</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/placement/readiness')}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Award className="h-4 w-4" />
            <span>Readiness Hub</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-slate-200/80 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div>
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

            <div>
              <Select
                value={readinessFilter}
                onChange={(e) => setReadinessFilter(e.target.value)}
                className="text-xs"
              >
                <option value="all">All Readiness Levels</option>
                <option value="Ready">Ready (75-100)</option>
                <option value="Nearly Ready">Nearly Ready (50-74)</option>
                <option value="Needs Preparation">Needs Prep (25-49)</option>
                <option value="Insufficient Data">Insufficient Data (&lt;25)</option>
              </Select>
            </div>

            <div>
              <Select
                value={placementStatusFilter}
                onChange={(e) => setPlacementStatusFilter(e.target.value)}
                className="text-xs"
              >
                <option value="all">All Placement Statuses</option>
                <option value="placed">Placed</option>
                <option value="in_process">In Process</option>
                <option value="unplaced">Unplaced</option>
              </Select>
            </div>

            <div>
              <Input
                type="number"
                placeholder="Grad Year (e.g. 2026)"
                value={gradYearFilter || ''}
                onChange={(e) =>
                  setGradYearFilter(e.target.value ? parseInt(e.target.value, 10) : undefined)
                }
                className="text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Directory Table */}
      <Card className="border border-slate-200/80 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-200/80 py-3.5 px-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-800">
                Enrolled Candidates ({pagination.totalCount})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Institutional records with verified placement dossier links.
              </CardDescription>
            </div>
            <span className="text-xs text-slate-400">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Spinner size="lg" className="text-emerald-600 mb-3" />
              <p className="text-xs font-medium text-slate-500">Loading student directory...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-semibold text-slate-900">No candidates match current criteria</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try adjusting your search query, department filter, or readiness category.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Dept & Degree</th>
                    <th className="py-3 px-4 text-center">Batch</th>
                    <th className="py-3 px-4">Readiness</th>
                    <th className="py-3 px-4 text-center">Profile %</th>
                    <th className="py-3 px-4">Placement Status</th>
                    <th className="py-3 px-4 text-center">Drives</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {students.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                            {student.fullName ? student.fullName.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              {student.fullName}
                              {student.hasOffer && (
                                <span title="Placed with active offer">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 inline" />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">{student.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{student.department || 'General'}</div>
                        <div className="text-[11px] text-slate-400">{student.degree || 'B.Tech'}</div>
                      </td>

                      <td className="py-3.5 px-4 text-center text-slate-600">
                        {student.graduationYear || '—'}
                      </td>

                      <td className="py-3.5 px-4">
                        {getReadinessBadge(student.readinessCategory)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-semibold ${
                            student.completionPercentage >= 70
                              ? 'text-emerald-600'
                              : student.completionPercentage >= 40
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {student.completionPercentage}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {getPlacementBadge(student.placementStatus)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {student.drivesAppliedCount}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/placement/students/${student.id}`)}
                          className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 text-xs px-2.5 py-1 font-semibold"
                        >
                          <span>Dossier</span>
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200/80 bg-slate-50/50">
              <p className="text-xs text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-700">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-700">
                  {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
                </span>{' '}
                of <span className="font-semibold text-slate-700">{pagination.totalCount}</span> results
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrevPage || loading}
                  onClick={() => loadStudents(pagination.page - 1)}
                  className="h-8 px-2.5 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNextPage || loading}
                  onClick={() => loadStudents(pagination.page + 1)}
                  className="h-8 px-2.5 text-xs"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

