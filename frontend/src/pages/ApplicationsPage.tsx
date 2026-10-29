import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Kanban,
  Table as TableIcon,
  Plus,
  Calendar,
  Clock,
  Trash2,
  Edit3,
  ExternalLink,
  AlertCircle,
  AlertTriangle,
  History,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input, Select, Textarea } from '../components/common/FormControls';
import { SearchBar } from '../components/common/SearchBar';
import { useStudentData } from '../context/StudentDataContext';
import { useToast } from '../context/ToastContext';
import { applicationService } from '../services/application.service';
import { sanitizeExternalUrl } from '../utils/url';
import {
  IJobApplication,
  ApplicationStatus,
  CreateApplicationPayload,
  UpdateApplicationPayload,
  ApplicationStatsSummary,
} from '../types/application.types';

const STATUS_COLUMNS: Array<{
  id: ApplicationStatus;
  label: string;
  variant: 'neutral' | 'info' | 'warning' | 'success' | 'danger';
  colorClass: string;
}> = [
  { id: 'Saved', label: 'Saved / Target', variant: 'neutral', colorClass: 'border-slate-300 bg-slate-100/80 text-slate-700' },
  { id: 'Applied', label: 'Applied', variant: 'info', colorClass: 'border-sky-300 bg-sky-50 text-sky-800' },
  { id: 'Assessment', label: 'Assessment / OA', variant: 'warning', colorClass: 'border-amber-300 bg-amber-50 text-amber-800' },
  { id: 'Interview', label: 'Interviewing', variant: 'info', colorClass: 'border-indigo-300 bg-indigo-50 text-indigo-800' },
  { id: 'Offer', label: 'Offer Received', variant: 'success', colorClass: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
  { id: 'Rejected', label: 'Rejected', variant: 'danger', colorClass: 'border-rose-300 bg-rose-50 text-rose-800' },
  { id: 'Withdrawn', label: 'Withdrawn', variant: 'neutral', colorClass: 'border-slate-200 bg-slate-50 text-slate-600' },
];

export const ApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { savedJobs } = useStudentData();
  const { success, error: toastError } = useToast();

  const [applications, setApplications] = useState<IJobApplication[]>([]);
  const [stats, setStats] = useState<ApplicationStatsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('appliedDate_desc');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<IJobApplication | null>(null);

  // Add Form State
  const [addForm, setAddForm] = useState<CreateApplicationPayload>({
    company: '',
    jobTitle: '',
    jobOpportunity: '',
    applicationUrl: '',
    status: 'Applied',
    appliedDate: new Date().toISOString().split('T')[0],
    interviewDate: '',
    deadline: '',
    followUpDate: '',
    location: '',
    employmentType: 'Full-time',
    workMode: 'Remote',
    compensation: '',
    notes: '',
  });

  // Edit Form State
  const [editForm, setEditForm] = useState<UpdateApplicationPayload>({
    company: '',
    jobTitle: '',
    applicationUrl: '',
    status: 'Applied',
    appliedDate: '',
    interviewDate: '',
    deadline: '',
    followUpDate: '',
    location: '',
    employmentType: 'Full-time',
    workMode: 'Remote',
    compensation: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load applications and stats
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [list, statsData] = await Promise.all([
        applicationService.getApplications(),
        applicationService.getApplicationStats(),
      ]);
      setApplications(list);
      setStats(statsData);
    } catch (err) {
      console.warn('Failed to load applications from API:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Quick Status Change
  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    try {
      const updated = await applicationService.updateApplication(appId, {
        status: newStatus,
        notes: `Status transitioned to ${newStatus}`,
      });
      setApplications((prev) => prev.map((a) => (a._id === appId ? updated : a)));
      applicationService.getApplicationStats().then(setStats).catch(() => {});
      success('Status Updated', `Application moved to ${newStatus}.`);
    } catch (err) {
      toastError('Update Failed', (err as Error).message || 'Could not update status.');
    }
  };

  // Handle Add Application
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.company && !addForm.jobOpportunity) {
      toastError('Validation Error', 'Please specify a company name or link an opportunity.');
      return;
    }
    if (!addForm.jobTitle && !addForm.jobOpportunity) {
      toastError('Validation Error', 'Please enter a job title.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await applicationService.createApplication({
        ...addForm,
        appliedDate: addForm.appliedDate || new Date().toISOString(),
        interviewDate: addForm.interviewDate || null,
        deadline: addForm.deadline || null,
        followUpDate: addForm.followUpDate || null,
      });

      setApplications((prev) => [created, ...prev]);
      applicationService.getApplicationStats().then(setStats).catch(() => {});
      setIsAddModalOpen(false);
      setAddForm({
        company: '',
        jobTitle: '',
        jobOpportunity: '',
        applicationUrl: '',
        status: 'Applied',
        appliedDate: new Date().toISOString().split('T')[0],
        interviewDate: '',
        deadline: '',
        followUpDate: '',
        location: '',
        employmentType: 'Full-time',
        workMode: 'Remote',
        compensation: '',
        notes: '',
      });
      success('Application Tracked! 🚀', `Added ${created.company} to your placement board.`);
    } catch (err) {
      toastError('Submission Failed', (err as Error).message || 'Unable to track application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Application
  const openEditModal = (app: IJobApplication) => {
    setSelectedApp(app);
    setEditForm({
      company: app.company,
      jobTitle: app.jobTitle,
      applicationUrl: app.applicationUrl || '',
      status: app.status,
      appliedDate: app.appliedDate ? new Date(app.appliedDate).toISOString().split('T')[0] : '',
      interviewDate: app.interviewDate ? new Date(app.interviewDate).toISOString().split('T')[0] : '',
      deadline: app.deadline ? new Date(app.deadline).toISOString().split('T')[0] : '',
      followUpDate: app.followUpDate ? new Date(app.followUpDate).toISOString().split('T')[0] : '',
      location: app.location || '',
      employmentType: app.employmentType || 'Full-time',
      workMode: app.workMode || 'Remote',
      compensation: app.compensation || '',
      notes: app.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    setIsSubmitting(true);
    try {
      const updated = await applicationService.updateApplication(selectedApp._id, {
        ...editForm,
        interviewDate: editForm.interviewDate || null,
        deadline: editForm.deadline || null,
        followUpDate: editForm.followUpDate || null,
      });

      setApplications((prev) => prev.map((a) => (a._id === selectedApp._id ? updated : a)));
      applicationService.getApplicationStats().then(setStats).catch(() => {});
      setIsEditModalOpen(false);
      success('Application Updated', `Saved changes for ${updated.company}.`);
    } catch (err) {
      toastError('Update Failed', (err as Error).message || 'Could not update application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Application
  const confirmDelete = async () => {
    if (!selectedApp) return;
    try {
      await applicationService.deleteApplication(selectedApp._id);
      setApplications((prev) => prev.filter((a) => a._id !== selectedApp._id));
      applicationService.getApplicationStats().then(setStats).catch(() => {});
      setIsDeleteModalOpen(false);
      success('Application Removed', `Deleted ${selectedApp.company} from pipeline.`);
    } catch (err) {
      toastError('Delete Failed', (err as Error).message || 'Could not delete application.');
    }
  };

  // Open History Audit Modal
  const openHistoryModal = (app: IJobApplication) => {
    setSelectedApp(app);
    setIsHistoryModalOpen(true);
  };

  // Pre-fill from Saved Opportunity selection
  const handleSelectSavedOpportunity = (oppId: string) => {
    const opp = savedJobs.find((j) => j.id === oppId);
    if (!opp) return;

    setAddForm((prev) => ({
      ...prev,
      jobOpportunity: opp.id,
      company: opp.company,
      jobTitle: opp.title,
      location: opp.location,
      workMode: opp.mode,
      employmentType: opp.type === 'Full-time' ? 'Full-time' : 'Internship',
      compensation: opp.compensation,
      deadline: opp.deadline ? opp.deadline.split('T')[0] : '',
      notes: `Imported from saved opportunities catalog.`,
    }));
  };

  // Filtered and Sorted Applications
  const filteredApplications = useMemo(() => {
    return applications
      .filter((app) => {
        // Status filter
        if (statusFilter !== 'all' && app.status !== statusFilter) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCompany = app.company.toLowerCase().includes(q);
          const matchTitle = app.jobTitle.toLowerCase().includes(q);
          const matchLocation = (app.location || '').toLowerCase().includes(q);
          if (!matchCompany && !matchTitle && !matchLocation) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'appliedDate_desc') {
          return new Date(b.appliedDate || 0).getTime() - new Date(a.appliedDate || 0).getTime();
        }
        if (sortBy === 'appliedDate_asc') {
          return new Date(a.appliedDate || 0).getTime() - new Date(b.appliedDate || 0).getTime();
        }
        if (sortBy === 'deadline_asc') {
          const timeA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
          const timeB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
          return timeA - timeB;
        }
        if (sortBy === 'interviewDate_asc') {
          const timeA = a.interviewDate ? new Date(a.interviewDate).getTime() : Infinity;
          const timeB = b.interviewDate ? new Date(b.interviewDate).getTime() : Infinity;
          return timeA - timeB;
        }
        if (sortBy === 'company_asc') {
          return a.company.localeCompare(b.company);
        }
        return 0;
      });
  }, [applications, statusFilter, searchQuery, sortBy]);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Application Tracker</h1>
            <Badge variant="info" size="sm">
              {stats?.total ?? applications.length} Placements Tracked
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Organize, follow up, and advance through interview stages for campus drives and external applications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" /> Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" /> Table
            </button>
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Add Application
          </Button>
        </div>
      </div>

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Tracked</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats?.total ?? applications.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Across all pipeline stages</div>
        </div>

        <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/40 shadow-2xs">
          <div className="text-[11px] font-semibold text-sky-800 uppercase tracking-wider">Active Pipeline</div>
          <div className="text-2xl font-black text-sky-900 mt-1">{stats?.activePipeline ?? 0}</div>
          <div className="text-[10px] text-sky-700 mt-0.5">Applied + Assessment + Interview</div>
        </div>

        <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/40 shadow-2xs">
          <div className="text-[11px] font-semibold text-indigo-800 uppercase tracking-wider">Interviews</div>
          <div className="text-2xl font-black text-indigo-900 mt-1">{stats?.interview ?? 0}</div>
          <div className="text-[10px] text-indigo-700 mt-0.5">Active interview rounds</div>
        </div>

        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Offers Extended</div>
          <div className="text-2xl font-black text-emerald-900 mt-1">{stats?.offer ?? 0}</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">Placement offers received</div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Response Rate</span>
            <span className="text-[10px] text-indigo-600 font-mono font-medium">OA/Interview/Offer</span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats?.responseRate ?? 0}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Of non-saved applications</div>
        </div>
      </div>

      {/* 3. Alerts Banners (Upcoming Interviews & Overdue Follow-ups) */}
      <div className="space-y-3">
        {stats && stats.overdueFollowUps.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <strong>Overdue Follow-ups ({stats.overdueFollowUps.length}):</strong>{' '}
                {stats.overdueFollowUps.map((app) => `${app.company} (${app.jobTitle})`).join(', ')} —{' '}
                <span className="text-amber-800">consider sending a recruiter follow-up email or updating the reminder date.</span>
              </div>
            </div>
            <button
              onClick={() => {
                setStatusFilter('Applied');
                setSearchQuery('');
              }}
              className="text-xs font-semibold text-amber-900 underline hover:text-amber-700 shrink-0 self-start sm:self-auto"
            >
              Filter Overdue
            </button>
          </div>
        )}

        {stats && stats.upcomingInterviews.length > 0 && (
          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <strong>Upcoming Interview Scheduled:</strong>{' '}
                {stats.upcomingInterviews[0].company} &bull; {stats.upcomingInterviews[0].jobTitle} on{' '}
                <span className="font-semibold text-indigo-950">
                  {new Date(stats.upcomingInterviews[0].interviewDate!).toLocaleDateString([], {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="primary"
              className="text-xs shrink-0 self-start sm:self-auto"
              onClick={() => navigate('/interview-prep')}
            >
              Practice for Interview
            </Button>
          </div>
        )}
      </div>

      {/* 4. Filters, Search & Sorting Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex-1 max-w-md">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by company, title, or location..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Statuses ({applications.length})</option>
              {STATUS_COLUMNS.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.label} ({applications.filter((a) => a.status === col.id).length})
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="appliedDate_desc">Applied: Newest First</option>
              <option value="appliedDate_asc">Applied: Oldest First</option>
              <option value="deadline_asc">Upcoming Deadlines</option>
              <option value="interviewDate_asc">Upcoming Interviews</option>
              <option value="company_asc">Company (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. Main Content: Kanban Board View or Table View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5 items-start overflow-x-auto pb-4">
          {STATUS_COLUMNS.map((col) => {
            const colItems = filteredApplications.filter((a) => a.status === col.id);

            return (
              <div
                key={col.id}
                className="bg-slate-100/90 rounded-2xl p-3 border border-slate-200 space-y-3 min-w-[240px] flex flex-col justify-start"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      {col.label}
                    </span>
                    <span className="w-5 h-5 rounded-full bg-white text-slate-700 text-[10px] font-bold flex items-center justify-center border border-slate-200">
                      {colItems.length}
                    </span>
                  </div>
                </div>

                {/* Column Application Cards */}
                <div className="space-y-2.5">
                  {colItems.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                      No applications
                    </div>
                  ) : (
                    colItems.map((item) => {
                      const isOverdue =
                        item.followUpDate &&
                        new Date(item.followUpDate) < startOfToday &&
                        ['Applied', 'Assessment', 'Interview'].includes(item.status);

                      const isInterviewUpcoming =
                        item.interviewDate &&
                        new Date(item.interviewDate) >= startOfToday &&
                        item.status !== 'Rejected' &&
                        item.status !== 'Withdrawn';

                      return (
                        <div
                          key={item._id}
                          className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:shadow-xs transition-all space-y-2.5"
                        >
                          {/* Card Top: Company, Title & Actions */}
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-xs text-slate-900 truncate">
                                {item.company}
                              </div>
                              <div className="text-[11px] text-slate-600 font-medium truncate">
                                {item.jobTitle}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => openHistoryModal(item)}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-colors"
                                title="View status audit history"
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
                                title="Edit application"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedApp(item);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                                title="Delete application"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Location, WorkMode & Links */}
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                            {item.location && <span>{item.location}</span>}
                            {item.workMode && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                {item.workMode}
                              </span>
                            )}
                            {item.applicationUrl && (
                              <a
                                href={sanitizeExternalUrl(item.applicationUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:underline inline-flex items-center gap-0.5"
                              >
                                Portal <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>

                          {/* Milestone Dates Badges */}
                          <div className="space-y-1 text-[10px]">
                            {item.appliedDate && (
                              <div className="text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                Applied:{' '}
                                {new Date(item.appliedDate).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </div>
                            )}

                            {isInterviewUpcoming && (
                              <div className="p-1.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 font-medium flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-indigo-600 shrink-0" />
                                <span>
                                  Interview:{' '}
                                  {new Date(item.interviewDate!).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              </div>
                            )}

                            {isOverdue && (
                              <div className="p-1.5 rounded-md bg-rose-50 border border-rose-100 text-rose-700 font-medium flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                                <span>Follow-up overdue</span>
                              </div>
                            )}

                            {!isOverdue && item.followUpDate && (
                              <div className="text-slate-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                Follow-up:{' '}
                                {new Date(item.followUpDate).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </div>
                            )}

                            {item.deadline && (
                              <div className="text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                Deadline:{' '}
                                {new Date(item.deadline).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </div>
                            )}
                          </div>

                          {/* Notes snippet */}
                          {item.notes && (
                            <div className="text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded-md border border-slate-100 line-clamp-2">
                              {item.notes}
                            </div>
                          )}

                          {/* Quick Stage Mover */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[10px]">
                            <span className="text-slate-400 font-medium">Stage:</span>
                            <select
                              value={item.status}
                              onChange={(e) =>
                                handleStatusChange(item._id, e.target.value as ApplicationStatus)
                              }
                              className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] text-slate-700 font-medium focus:outline-hidden"
                            >
                              {STATUS_COLUMNS.map((sc) => (
                                <option key={sc.id} value={sc.id}>
                                  {sc.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Company & Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Applied Date</th>
                  <th className="py-3 px-4">Milestones & Follow-up</th>
                  <th className="py-3 px-4">Location & Mode</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No applications match the active filters.
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((app) => {
                    const isOverdue =
                      app.followUpDate &&
                      new Date(app.followUpDate) < startOfToday &&
                      ['Applied', 'Assessment', 'Interview'].includes(app.status);

                    return (
                      <tr key={app._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{app.company}</div>
                          <div className="text-slate-500 text-[11px]">{app.jobTitle}</div>
                          {app.applicationUrl && (
                            <a
                              href={sanitizeExternalUrl(app.applicationUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-indigo-600 hover:underline inline-flex items-center gap-0.5 mt-0.5"
                            >
                              Portal link <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <select
                            value={app.status}
                            onChange={(e) =>
                              handleStatusChange(app._id, e.target.value as ApplicationStatus)
                            }
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 shadow-2xs focus:outline-hidden"
                          >
                            {STATUS_COLUMNS.map((sc) => (
                              <option key={sc.id} value={sc.id}>
                                {sc.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          {app.appliedDate
                            ? new Date(app.appliedDate).toLocaleDateString([], {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : '—'}
                        </td>

                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {app.interviewDate && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                <Calendar className="w-3 h-3" />
                                Interview:{' '}
                                {new Date(app.interviewDate).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            )}
                            {isOverdue && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                                <AlertCircle className="w-3 h-3" /> Follow-up Overdue
                              </span>
                            )}
                            {!isOverdue && app.followUpDate && (
                              <div className="text-[11px] text-slate-500">
                                Follow-up: {new Date(app.followUpDate).toLocaleDateString()}
                              </div>
                            )}
                            {app.deadline && (
                              <div className="text-[11px] text-slate-400">
                                Deadline: {new Date(app.deadline).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          <div>{app.location || 'Remote'}</div>
                          <div className="text-[11px] text-slate-400">
                            {app.employmentType} &bull; {app.workMode}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openHistoryModal(app)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                              title="Audit History"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(app)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Edit Details"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedApp(app);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Delete Application"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Add Application Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Track New Job or Internship"
        description="Add a campus drive or off-campus application to your tracking board."
        size="lg"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {savedJobs.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Quick Import from Saved Opportunities (Optional)
              </label>
              <select
                onChange={(e) => handleSelectSavedOpportunity(e.target.value)}
                className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
              >
                <option value="">Select a bookmarked opportunity to auto-fill...</option>
                {savedJobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.company} — {job.title} ({job.location})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Company Name"
              placeholder="e.g. Stripe, Amazon, Google"
              value={addForm.company || ''}
              onChange={(e) => setAddForm({ ...addForm, company: e.target.value })}
              required
            />
            <Input
              label="Role Title"
              placeholder="e.g. Software Engineer Intern"
              value={addForm.jobTitle || ''}
              onChange={(e) => setAddForm({ ...addForm, jobTitle: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Application Portal URL (Optional)"
              placeholder="https://company.com/jobs/123"
              value={addForm.applicationUrl || ''}
              onChange={(e) => setAddForm({ ...addForm, applicationUrl: e.target.value })}
            />
            <Select
              label="Initial Status"
              value={addForm.status}
              onChange={(e) =>
                setAddForm({ ...addForm, status: e.target.value as ApplicationStatus })
              }
              options={STATUS_COLUMNS.map((c) => ({ label: c.label, value: c.id }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <Input
              label="Date Applied"
              type="date"
              value={addForm.appliedDate || ''}
              onChange={(e) => setAddForm({ ...addForm, appliedDate: e.target.value })}
            />
            <Input
              label="Interview Date (Optional)"
              type="date"
              value={addForm.interviewDate || ''}
              onChange={(e) => setAddForm({ ...addForm, interviewDate: e.target.value })}
            />
            <Input
              label="Follow-up Date (Optional)"
              type="date"
              value={addForm.followUpDate || ''}
              onChange={(e) => setAddForm({ ...addForm, followUpDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <Input
              label="Location"
              placeholder="e.g. Bangalore, India"
              value={addForm.location || ''}
              onChange={(e) => setAddForm({ ...addForm, location: e.target.value })}
            />
            <Select
              label="Work Mode"
              value={addForm.workMode || 'Remote'}
              onChange={(e) => setAddForm({ ...addForm, workMode: e.target.value })}
              options={[
                { label: 'Remote', value: 'Remote' },
                { label: 'Hybrid', value: 'Hybrid' },
                { label: 'On-site', value: 'On-site' },
              ]}
            />
            <Input
              label="Compensation / Stipend"
              placeholder="e.g. $55 / hr or 14 LPA"
              value={addForm.compensation || ''}
              onChange={(e) => setAddForm({ ...addForm, compensation: e.target.value })}
            />
          </div>

          <Textarea
            label="Notes / Referral / Recruiter Contact"
            rows={2}
            placeholder="e.g. Referred by alum on LinkedIn; OA contains 2 DSA questions."
            value={addForm.notes || ''}
            onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Track Application
            </Button>
          </div>
        </form>
      </Modal>

      {/* 7. Edit Application Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Application Details"
        description="Update dates, stages, or notes for this tracked position."
        size="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Company Name"
              value={editForm.company || ''}
              onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
              required
            />
            <Input
              label="Role Title"
              value={editForm.jobTitle || ''}
              onChange={(e) => setEditForm({ ...editForm, jobTitle: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Application Portal URL"
              value={editForm.applicationUrl || ''}
              onChange={(e) => setEditForm({ ...editForm, applicationUrl: e.target.value })}
            />
            <Select
              label="Status"
              value={editForm.status}
              onChange={(e) =>
                setEditForm({ ...editForm, status: e.target.value as ApplicationStatus })
              }
              options={STATUS_COLUMNS.map((c) => ({ label: c.label, value: c.id }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <Input
              label="Date Applied"
              type="date"
              value={editForm.appliedDate || ''}
              onChange={(e) => setEditForm({ ...editForm, appliedDate: e.target.value })}
            />
            <Input
              label="Interview Date"
              type="date"
              value={editForm.interviewDate || ''}
              onChange={(e) => setEditForm({ ...editForm, interviewDate: e.target.value })}
            />
            <Input
              label="Follow-up Date"
              type="date"
              value={editForm.followUpDate || ''}
              onChange={(e) => setEditForm({ ...editForm, followUpDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <Input
              label="Location"
              value={editForm.location || ''}
              onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
            />
            <Select
              label="Work Mode"
              value={editForm.workMode || 'Remote'}
              onChange={(e) => setEditForm({ ...editForm, workMode: e.target.value })}
              options={[
                { label: 'Remote', value: 'Remote' },
                { label: 'Hybrid', value: 'Hybrid' },
                { label: 'On-site', value: 'On-site' },
              ]}
            />
            <Input
              label="Compensation"
              value={editForm.compensation || ''}
              onChange={(e) => setEditForm({ ...editForm, compensation: e.target.value })}
            />
          </div>

          <Textarea
            label="Notes & Next Steps"
            rows={2}
            value={editForm.notes || ''}
            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* 8. Status History Audit Trail Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Application Status History"
        description={
          selectedApp
            ? `${selectedApp.company} — ${selectedApp.jobTitle} audit trail`
            : 'Audit history'
        }
        size="md"
      >
        <div className="space-y-4">
          {selectedApp?.statusHistory && selectedApp.statusHistory.length > 0 ? (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {selectedApp.statusHistory.map((entry, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white ring-2 ring-indigo-100" />
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{entry.status}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(entry.changedAt).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                    {entry.notes && <p className="text-slate-600 text-[11px]">{entry.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-400">
              No status transitions logged yet.
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsHistoryModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* 9. Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Tracked Application"
        description="Are you sure you want to remove this position from your pipeline?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            This will permanently remove <strong>{selectedApp?.company}</strong> (
            {selectedApp?.jobTitle}) and its complete transition history from your placement board.
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button size="sm" variant="danger" onClick={confirmDelete}>
              Delete Application
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
