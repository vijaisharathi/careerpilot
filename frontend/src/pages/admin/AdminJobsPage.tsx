import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Archive,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Building2,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input, Textarea } from '../../components/common/FormControls';
import { Spinner } from '../../components/common/Spinner';
import { adminService } from '../../services/admin.service';
import { AdminJobItem, AdminPagination } from '../../types/admin.types';
import { useToast } from '../../context/ToastContext';

interface JobFormData {
  title: string;
  company: string;
  description: string;
  roleCategory: string;
  employmentType: 'Full-time' | 'Internship' | 'Co-op' | 'Contract';
  workMode: 'Remote' | 'Hybrid' | 'On-site';
  location: string;
  compensationAmount: string;
  compensationPeriod: 'yearly' | 'monthly' | 'hourly';
  applicationUrl: string;
  source: string;
  isVerifiedVacancy: boolean;
  status: 'published' | 'draft' | 'active' | 'expired' | 'archived';
  requiredSkillsText: string;
}

export const AdminJobsPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [jobs, setJobs] = useState<AdminJobItem[]>([]);
  const [pagination, setPagination] = useState<AdminPagination>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');

  // Create / Edit Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    company: '',
    description: '',
    roleCategory: 'Full-Stack Developer',
    employmentType: 'Full-time',
    workMode: 'Remote',
    location: '',
    compensationAmount: '$100,000 - $130,000',
    compensationPeriod: 'yearly',
    applicationUrl: '',
    source: 'Campus Placement Portal',
    isVerifiedVacancy: true,
    status: 'published',
    requiredSkillsText: 'TypeScript, React, Node.js',
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation Modal
  const [deleteTargetJob, setDeleteTargetJob] = useState<AdminJobItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadJobs = useCallback(
    async (pageToLoad = 1) => {
      setLoading(true);
      try {
        const data = await adminService.getJobs({
          page: pageToLoad,
          limit: 10,
          search: searchQuery.trim() || undefined,
          status: statusFilter,
          employmentType: typeFilter !== 'all' ? typeFilter : undefined,
          workMode: modeFilter !== 'all' ? modeFilter : undefined,
        });
        setJobs(data.jobs);
        setPagination(data.pagination);
      } catch (err) {
        toastError('Failed to load listings', (err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, statusFilter, typeFilter, modeFilter, toastError]
  );

  useEffect(() => {
    loadJobs(1);
  }, [loadJobs]);

  const handleOpenCreateModal = () => {
    setEditingJobId(null);
    setFormData({
      title: '',
      company: '',
      description: '',
      roleCategory: 'Full-Stack Developer',
      employmentType: 'Full-time',
      workMode: 'Remote',
      location: 'Bengaluru / Remote',
      compensationAmount: '$100,000 - $130,000',
      compensationPeriod: 'yearly',
      applicationUrl: 'https://',
      source: 'Campus Placement Drive',
      isVerifiedVacancy: true,
      status: 'published',
      requiredSkillsText: 'TypeScript, React, Node.js',
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (job: AdminJobItem) => {
    setEditingJobId(job._id);
    setFormData({
      title: job.title,
      company: job.company,
      description: job.description,
      roleCategory: job.roleCategory,
      employmentType: job.employmentType,
      workMode: job.workMode,
      location: job.location,
      compensationAmount: job.compensation.amount,
      compensationPeriod: job.compensation.period,
      applicationUrl: job.applicationUrl,
      source: job.source,
      isVerifiedVacancy: job.isVerifiedVacancy,
      status: job.status as 'published' | 'draft',
      requiredSkillsText: job.requiredSkills.map((s) => s.name).join(', '),
    });
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.applicationUrl.startsWith('http://') && !formData.applicationUrl.startsWith('https://')) {
      toastError('Invalid URL', 'Application URL must start with http:// or https://');
      return;
    }

    setSubmitting(true);
    try {
      const skills = formData.requiredSkillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => ({
          name: s,
          minProficiency: 'Intermediate' as const,
          importance: 'critical' as const,
          weight: 4,
        }));

      const payload = {
        title: formData.title.trim(),
        company: formData.company.trim(),
        description: formData.description.trim(),
        roleCategory: formData.roleCategory,
        employmentType: formData.employmentType,
        workMode: formData.workMode,
        location: formData.location.trim(),
        compensation: {
          amount: formData.compensationAmount.trim(),
          currency: 'USD',
          period: formData.compensationPeriod,
        },
        experienceRequirements: { minYears: 0, level: 'Entry-Level' },
        requiredSkills: skills,
        applicationUrl: formData.applicationUrl.trim(),
        source: formData.source.trim(),
        isVerifiedVacancy: formData.isVerifiedVacancy,
        status: formData.status,
      };

      if (editingJobId) {
        await adminService.updateJob(editingJobId, payload);
        toastSuccess('Job Updated', `Listing "${payload.title}" updated successfully.`);
      } else {
        await adminService.createJob(payload);
        toastSuccess('Job Created', `New vacancy "${payload.title}" created successfully.`);
      }

      setIsFormModalOpen(false);
      loadJobs(pagination.page);
    } catch (err) {
      toastError('Save Failed', (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (
    jobId: string,
    newStatus: 'draft' | 'published' | 'active' | 'expired' | 'archived'
  ) => {
    try {
      await adminService.updateJobStatus(jobId, newStatus);
      toastSuccess('Status Changed', `Job listing status updated to ${newStatus}`);
      loadJobs(pagination.page);
    } catch (err) {
      toastError('Status Update Failed', (err as Error).message);
    }
  };

  const handleDeleteJob = async () => {
    if (!deleteTargetJob) return;
    setDeleting(true);
    try {
      await adminService.deleteJob(deleteTargetJob._id);
      toastSuccess('Job Deleted', `Listing "${deleteTargetJob.title}" was deleted.`);
      setIsDeleteModalOpen(false);
      loadJobs(pagination.page);
    } catch (err) {
      toastError('Delete Failed', (err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
      case 'active':
        return <Badge variant="success" size="sm">Published</Badge>;
      case 'draft':
        return <Badge variant="neutral" size="sm">Draft</Badge>;
      case 'expired':
        return <Badge variant="warning" size="sm">Expired</Badge>;
      case 'archived':
        return <Badge variant="danger" size="sm">Archived</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Job & Internship Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Author and verify campus opportunities, monitor application pipelines, and manage publication states.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadJobs(pagination.page)}
            className="flex items-center"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            <span>Refresh</span>
          </Button>

          <Button variant="primary" size="sm" onClick={handleOpenCreateModal} className="flex items-center">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            <span>Create Opportunity</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:space-x-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search listings by title, company, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published / Active</option>
              <option value="draft">Drafts</option>
              <option value="expired">Expired</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Internship">Internship</option>
              <option value="Co-op">Co-op</option>
            </select>

            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Modes</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Listings Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center">
              <Spinner size="md" className="text-indigo-600 mb-2" />
              <p className="text-xs text-slate-500">Retrieving opportunities...</p>
            </div>
          ) : jobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Opportunity</th>
                    <th className="py-3 px-4">Role & Mode</th>
                    <th className="py-3 px-4">Verification</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Published Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map((job) => (
                    <tr key={job._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-slate-900">{job.title}</p>
                          <p className="text-[11px] text-slate-500 flex items-center mt-0.5">
                            <Building2 className="w-3 h-3 mr-1 text-slate-400" />
                            <span>{job.company}</span>
                            <span className="mx-1.5">•</span>
                            <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                            <span>{job.location}</span>
                          </p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">
                        <p className="font-medium">{job.roleCategory}</p>
                        <p className="text-[11px] text-slate-400">
                          {job.employmentType} ({job.workMode})
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        {job.isVerifiedVacancy ? (
                          <Badge variant="success" size="sm" className="flex items-center w-fit">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            <span>Verified Post</span>
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            Demo / Seed
                          </Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-4">{getStatusBadge(job.status)}</td>

                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(job.publicationDate || job.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenEditModal(job)}
                          title="Edit Listing"
                          className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {job.status === 'published' || job.status === 'active' ? (
                          <button
                            onClick={() => handleStatusChange(job._id, 'archived')}
                            title="Archive Listing"
                            className="p-1.5 rounded hover:bg-amber-100 text-amber-700 transition-colors"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(job._id, 'published')}
                            title="Publish Listing"
                            className="p-1.5 rounded hover:bg-emerald-100 text-emerald-700 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setDeleteTargetJob(job);
                            setIsDeleteModalOpen(true);
                          }}
                          title="Delete Listing"
                          className="p-1.5 rounded hover:bg-rose-100 text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400">
              <Briefcase className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No job listings found</p>
              <p className="text-xs text-slate-500 mt-1">Create an opportunity or adjust filters above.</p>
            </div>
          )}

          {/* Pagination Toolbar */}
          {pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>
                Page <span className="font-bold text-slate-700">{pagination.page}</span> of{' '}
                <span className="font-bold text-slate-700">{pagination.totalPages}</span> ({pagination.totalCount}{' '}
                total opportunities)
              </span>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadJobs(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage || loading}
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  <span>Previous</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadJobs(pagination.page + 1)}
                  disabled={!pagination.hasNextPage || loading}
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Job Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingJobId ? 'Edit Placement Listing' : 'Author Placement Opportunity'}
      >
        <form onSubmit={handleSubmitForm} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title</label>
              <Input
                type="text"
                required
                placeholder="e.g. Full-Stack Developer"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hiring Company</label>
              <Input
                type="text"
                required
                placeholder="e.g. Stripe, Razorpay"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
              <select
                value={formData.employmentType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    employmentType: e.target.value as 'Full-time' | 'Internship' | 'Co-op' | 'Contract',
                  })
                }
                className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              >
                <option value="Full-time">Full-time</option>
                <option value="Internship">Internship</option>
                <option value="Co-op">Co-op</option>
                <option value="Contract">Contract</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Mode</label>
              <select
                value={formData.workMode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    workMode: e.target.value as 'Remote' | 'Hybrid' | 'On-site',
                  })
                }
                className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as 'published' | 'draft',
                  })
                }
                className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
              <Input
                type="text"
                required
                placeholder="e.g. Bengaluru, India"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Compensation</label>
              <Input
                type="text"
                placeholder="e.g. ₹18,00,000 / yr"
                value={formData.compensationAmount}
                onChange={(e) => setFormData({ ...formData, compensationAmount: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              External Application URL (Must begin with http:// or https://)
            </label>
            <Input
              type="url"
              required
              placeholder="https://company.com/jobs/123"
              value={formData.applicationUrl}
              onChange={(e) => setFormData({ ...formData, applicationUrl: e.target.value })}
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Required Skills (Comma separated)</label>
            <Input
              type="text"
              placeholder="e.g. React, TypeScript, Node.js, Docker"
              value={formData.requiredSkillsText}
              onChange={(e) => setFormData({ ...formData, requiredSkillsText: e.target.value })}
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Job Description</label>
            <Textarea
              rows={4}
              required
              placeholder="Outline role responsibilities, team structure, and qualifications..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center space-x-2 text-xs text-slate-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isVerifiedVacancy}
                onChange={(e) => setFormData({ ...formData, isVerifiedVacancy: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Mark as Verified Campus Partner Vacancy</span>
            </label>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsFormModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : editingJobId ? 'Update Listing' : 'Publish Opportunity'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion of Job Opportunity"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Are you sure you want to permanently delete{' '}
            <span className="font-bold text-slate-900">{deleteTargetJob?.title}</span> at{' '}
            <span className="font-bold text-slate-900">{deleteTargetJob?.company}</span>?
          </p>

          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
            Students who saved or tracked this opportunity will see it archived from live discovery.
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteJob} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
