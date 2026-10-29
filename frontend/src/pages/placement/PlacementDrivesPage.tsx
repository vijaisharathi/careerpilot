import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Calendar,
  Building2,
  Users,
  Clock,
  Download,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input, Select, Textarea } from '../../components/common/FormControls';
import { Spinner } from '../../components/common/Spinner';
import { placementService } from '../../services/placement.service';
import { PlacementDriveItem, PlacementDriveStatus } from '../../types/placement.types';
import { useToast } from '../../context/ToastContext';

export const PlacementDrivesPage: React.FC = () => {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const [drives, setDrives] = useState<PlacementDriveItem[]>([]);
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
  const [statusFilter, setStatusFilter] = useState('all');

  // Create Drive Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    driveTitle: '',
    jobRole: '',
    jobDescription: '',
    location: '',
    workMode: 'On-site' as 'On-site' | 'Hybrid' | 'Remote',
    employmentType: 'Full-time' as 'Full-time' | 'Internship' | 'Co-op' | 'Contract',
    salaryAmount: '12 LPA',
    salaryPeriod: 'yearly' as 'yearly' | 'monthly' | 'hourly',
    salaryCurrency: 'INR',
    registrationStartDate: new Date().toISOString().split('T')[0],
    registrationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    assessmentDate: '',
    eligibleDepartments: 'Computer Science, Information Technology',
    eligibleGraduationYears: '2026',
    minGpa: 7.0,
    minProfileCompletion: 70,
    minReadinessScore: 60,
    requiredSkillsMustMatch: false,
    requiredSkills: 'JavaScript, React, Node.js',
    status: 'registration_open' as PlacementDriveStatus,
  });

  const loadDrives = useCallback(
    async (pageToLoad = 1) => {
      setLoading(true);
      try {
        const data = await placementService.getDrives({
          page: pageToLoad,
          limit: 10,
          search: searchQuery.trim() || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        });
        setDrives(data.drives);
        setPagination(data.pagination);
      } catch (err) {
        toastError('Failed to load drives', (err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, statusFilter, toastError]
  );

  useEffect(() => {
    loadDrives(1);
  }, [loadDrives]);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const blob = await placementService.exportCsv('drives');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recruitment_drives_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toastSuccess('Export Complete', 'Recruitment drives exported successfully.');
    } catch (err) {
      toastError('Export Failed', (err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const handleCreateDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.driveTitle || !formData.jobRole || !formData.jobDescription) {
      toastError('Validation Error', 'Please complete all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      const payload: Partial<PlacementDriveItem> = {
        companyName: formData.companyName.trim(),
        driveTitle: formData.driveTitle.trim(),
        jobRole: formData.jobRole.trim(),
        jobDescription: formData.jobDescription.trim(),
        location: formData.location.trim() || 'Campus',
        workMode: formData.workMode,
        employmentType: formData.employmentType,
        compensation: {
          amount: formData.salaryAmount,
          period: formData.salaryPeriod,
          currency: formData.salaryCurrency,
        },
        registrationStartDate: formData.registrationStartDate,
        registrationDeadline: formData.registrationDeadline,
        assessmentDate: formData.assessmentDate || undefined,
        requiredSkills: formData.requiredSkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        eligibilityCriteria: {
          eligibleDepartments: formData.eligibleDepartments
            .split(',')
            .map((d) => d.trim())
            .filter(Boolean),
          eligibleGraduationYears: formData.eligibleGraduationYears
            .split(',')
            .map((y) => parseInt(y.trim(), 10))
            .filter((y) => !isNaN(y)),
          minGpa: Number(formData.minGpa) || undefined,
          minProfileCompletion: Number(formData.minProfileCompletion) || undefined,
          minReadinessScore: Number(formData.minReadinessScore) || undefined,
          requiredSkillsMustMatch: formData.requiredSkillsMustMatch,
        },
        status: formData.status,
      };

      await placementService.createDrive(payload);
      toastSuccess('Drive Created', `Recruitment drive for ${formData.companyName} created successfully.`);
      setIsCreateModalOpen(false);
      loadDrives(1);
    } catch (err) {
      toastError('Creation Failed', (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: PlacementDriveStatus) => {
    switch (status) {
      case 'registration_open':
        return <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200">Registration Open</Badge>;
      case 'in_progress':
        return <Badge variant="warning" className="bg-amber-50 text-amber-700 border-amber-200">In Progress</Badge>;
      case 'published':
        return <Badge variant="primary" className="bg-blue-50 text-blue-700 border-blue-200">Published</Badge>;
      case 'registration_closed':
        return <Badge variant="secondary" className="bg-slate-100 text-slate-700">Registration Closed</Badge>;
      case 'completed':
        return <Badge variant="success" className="bg-emerald-100 text-emerald-800">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="danger" className="bg-rose-50 text-rose-700 border-rose-200">Cancelled</Badge>;
      case 'draft':
      default:
        return <Badge variant="default" className="bg-slate-100 text-slate-600">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Recruitment Drives Management
            </h1>
            <Badge variant="primary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              Active Portal
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Publish campus drives, manage recruitment cycles, configure eligibility criteria, and track candidate progression.
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
            <span>Export Drives CSV</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Create Recruitment Drive</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-slate-200/80 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by company, role, or drive title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs"
              >
                <option value="all">All Drive Statuses</option>
                <option value="registration_open">Registration Open</option>
                <option value="in_progress">In Progress</option>
                <option value="published">Published</option>
                <option value="registration_closed">Registration Closed</option>
                <option value="completed">Completed</option>
                <option value="draft">Draft</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drives List */}
      <Card className="border border-slate-200/80 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-200/80 py-3.5 px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-900">
              Campus Recruitment Drives ({pagination.totalCount})
            </CardTitle>
            <span className="text-xs text-slate-400">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Spinner size="lg" className="text-emerald-600 mb-3" />
              <p className="text-xs font-medium text-slate-500">Loading recruitment drives...</p>
            </div>
          ) : drives.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Briefcase className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-semibold text-slate-900">No recruitment drives found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No drives match the current filter criteria or none have been scheduled yet.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Schedule First Drive
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {drives.map((drive) => {
                const driveId = drive._id || drive.id || '';
                return (
                  <div
                    key={driveId}
                    className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 max-w-xl">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-base text-slate-900">{drive.companyName}</span>
                        {getStatusBadge(drive.status)}
                        <Badge variant="secondary" className="text-[11px] bg-slate-100">
                          {drive.workMode}
                        </Badge>
                        <Badge variant="secondary" className="text-[11px] bg-slate-100">
                          {drive.employmentType}
                        </Badge>
                      </div>

                      <div className="text-xs font-semibold text-slate-700">
                        {drive.driveTitle} • <span className="text-emerald-700 font-medium">{drive.jobRole}</span>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {drive.jobDescription}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          Deadline: {new Date(drive.registrationDeadline).toLocaleDateString()}
                        </span>
                        {drive.compensation?.amount && (
                          <span className="font-semibold text-emerald-700">
                            {drive.compensation.amount} ({drive.compensation.period})
                          </span>
                        )}
                        <span>
                          Eligible: {drive.eligibilityCriteria.eligibleDepartments.join(', ') || 'All Depts'}
                        </span>
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-3 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <div className="text-center px-2 py-1 bg-slate-100 rounded">
                          <div className="font-bold text-slate-900 text-sm">
                            {drive.candidateCounts?.total ?? 0}
                          </div>
                          <div className="text-[10px] text-slate-500">Registered</div>
                        </div>
                        <div className="text-center px-2 py-1 bg-emerald-50 rounded">
                          <div className="font-bold text-emerald-800 text-sm">
                            {drive.candidateCounts?.offered ?? 0}
                          </div>
                          <div className="text-[10px] text-emerald-700">Offered</div>
                        </div>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/placement/drives/${driveId}`)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3.5 py-1.5 flex items-center gap-1.5"
                      >
                        <span>Manage Candidates & Stages</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
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
                of <span className="font-semibold text-slate-700">{pagination.totalCount}</span> drives
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrevPage || loading}
                  onClick={() => loadDrives(pagination.page - 1)}
                  className="h-8 px-2.5 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNextPage || loading}
                  onClick={() => loadDrives(pagination.page + 1)}
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

      {/* Create Drive Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Schedule New Campus Recruitment Drive"
        size="lg"
      >
        <form onSubmit={handleCreateDrive} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name *</label>
              <Input
                placeholder="e.g. Google India"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Drive Title *</label>
              <Input
                placeholder="e.g. Graduate Software Engineer Drive 2026"
                value={formData.driveTitle}
                onChange={(e) => setFormData({ ...formData, driveTitle: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Job Role *</label>
              <Input
                placeholder="e.g. Associate Software Engineer"
                value={formData.jobRole}
                onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
              <Input
                placeholder="e.g. Bangalore / Hyderabad"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Mode</label>
              <Select
                value={formData.workMode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    workMode: e.target.value as 'On-site' | 'Hybrid' | 'Remote',
                  })
                }
              >
                <option value="On-site">On-site</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Remote">Remote</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Employment Type</label>
              <Select
                value={formData.employmentType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    employmentType: e.target.value as 'Full-time' | 'Internship' | 'Co-op' | 'Contract',
                  })
                }
              >
                <option value="Full-time">Full-time</option>
                <option value="Internship">Internship</option>
                <option value="Co-op">Co-op</option>
                <option value="Contract">Contract</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Compensation / Package</label>
              <Input
                placeholder="e.g. 14 LPA"
                value={formData.salaryAmount}
                onChange={(e) => setFormData({ ...formData, salaryAmount: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Drive Status</label>
              <Select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as PlacementDriveStatus })
                }
              >
                <option value="registration_open">Registration Open</option>
                <option value="published">Published (Announced)</option>
                <option value="draft">Draft</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Registration Start Date</label>
              <Input
                type="date"
                value={formData.registrationStartDate}
                onChange={(e) => setFormData({ ...formData, registrationStartDate: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Registration Deadline *</label>
              <Input
                type="date"
                value={formData.registrationDeadline}
                onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Job Description *</label>
            <Textarea
              rows={3}
              placeholder="Detailed description of responsibilities, requirements, and job overview..."
              value={formData.jobDescription}
              onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
              required
            />
          </div>

          {/* Eligibility Configuration Card */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Rule-Based Eligibility Configuration
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Eligible Departments (comma-separated)
                </label>
                <Input
                  value={formData.eligibleDepartments}
                  onChange={(e) => setFormData({ ...formData, eligibleDepartments: e.target.value })}
                  placeholder="Computer Science, Information Technology"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Eligible Graduation Years (comma-separated)
                </label>
                <Input
                  value={formData.eligibleGraduationYears}
                  onChange={(e) => setFormData({ ...formData, eligibleGraduationYears: e.target.value })}
                  placeholder="2026, 2027"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Minimum CGPA / Percentage
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.minGpa}
                  onChange={(e) => setFormData({ ...formData, minGpa: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Min Profile Completeness (%)
                </label>
                <Input
                  type="number"
                  value={formData.minProfileCompletion}
                  onChange={(e) =>
                    setFormData({ ...formData, minProfileCompletion: parseInt(e.target.value, 10) || 0 })
                  }
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Min Placement Readiness Score (0-100)
                </label>
                <Input
                  type="number"
                  value={formData.minReadinessScore}
                  onChange={(e) =>
                    setFormData({ ...formData, minReadinessScore: parseInt(e.target.value, 10) || 0 })
                  }
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Required Skills (comma-separated)
                </label>
                <Input
                  value={formData.requiredSkills}
                  onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
                  placeholder="React, Node.js, SQL"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {submitting ? <Spinner size="sm" className="mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
              Publish Recruitment Drive
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

