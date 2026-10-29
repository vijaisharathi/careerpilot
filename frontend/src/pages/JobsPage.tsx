import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Search,
  Filter,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  DollarSign,
  Building2,
  MapPin,
  Sparkles,
  AlertCircle,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  HelpCircle,
  XCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { useStudentData } from '../context/StudentDataContext';
import { useToast } from '../context/ToastContext';
import { sanitizeExternalUrl } from '../utils/url';
import { jobService } from '../services/job.service';
import {
  BackendJobOpportunity,
  JobSearchPagination,
  SavedJobItem,
} from '../types/job.types';

export const JobsPage: React.FC = () => {
  const navigate = useNavigate();
  const { addApplication } = useStudentData();
  const { success, error: toastError, info } = useToast();

  // Active Tab: 'all' or 'saved'
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterMode, setFilterMode] = useState('all');
  const [filterMinMatch, setFilterMinMatch] = useState('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'deadline'>('relevance');

  // Data states
  const [opportunities, setOpportunities] = useState<BackendJobOpportunity[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>([]);
  const [pagination, setPagination] = useState<JobSearchPagination>({
    page: 1,
    limit: 6,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Quick Apply Modal
  const [applyModalJob, setApplyModalJob] = useState<BackendJobOpportunity | null>(null);
  const [applyNotes, setApplyNotes] = useState('');

  // Fetch opportunities from backend
  const fetchOpportunities = useCallback(
    async (pageNumber = 1) => {
      setIsLoading(true);
      try {
        if (activeTab === 'saved') {
          const savedList = await jobService.getSavedJobs();
          setSavedJobs(savedList);
          const mappedJobs = savedList
            .map((s) => s.jobDetails)
            .filter((j): j is BackendJobOpportunity => !!j);
          setOpportunities(mappedJobs);
          setPagination({
            page: 1,
            limit: mappedJobs.length || 1,
            totalCount: mappedJobs.length,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          });
        } else {
          const res = await jobService.searchJobs({
            q: searchQuery.trim() || undefined,
            employmentType: filterType !== 'all' ? filterType : undefined,
            workMode: filterMode !== 'all' ? filterMode : undefined,
            minScore: filterMinMatch !== 'all' ? Number(filterMinMatch) : undefined,
            sortBy,
            page: pageNumber,
            limit: 6,
          });
          setOpportunities(res.opportunities);
          setPagination(res.pagination);
        }
      } catch (err) {
        console.error('Failed to load opportunities:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [activeTab, searchQuery, filterType, filterMode, filterMinMatch, sortBy]
  );

  useEffect(() => {
    fetchOpportunities(1);
  }, [fetchOpportunities]);

  // Handle Save / Unsave
  const handleToggleSave = async (e: React.MouseEvent, job: BackendJobOpportunity) => {
    e.stopPropagation();
    const isCurrentlySaved = !!job.isSaved;

    // Optimistic UI update
    setOpportunities((prev) =>
      prev.map((j) => (j._id === job._id ? { ...j, isSaved: !isCurrentlySaved } : j))
    );

    try {
      if (isCurrentlySaved) {
        await jobService.unsaveJob(job._id);
        success('Opportunity Unsaved', `Removed ${job.company} from saved list.`);
      } else {
        await jobService.saveJob(job._id);
        success('Opportunity Saved! 🔖', `Added ${job.company} to your bookmarked positions.`);
      }

      if (activeTab === 'saved') {
        fetchOpportunities(1);
      }
    } catch (err) {
      // Revert optimistic update on failure
      setOpportunities((prev) =>
        prev.map((j) => (j._id === job._id ? { ...j, isSaved: isCurrentlySaved } : j))
      );
      toastError('Action Failed', (err as Error).message || 'Could not update saved status.');
    }
  };

  // Quick Apply submission
  const handleConfirmApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyModalJob) return;

    addApplication({
      jobId: applyModalJob._id,
      company: applyModalJob.company,
      role: applyModalJob.title,
      location: applyModalJob.location,
      type: applyModalJob.employmentType === 'Full-time' ? 'Full-time' : 'Internship',
      appliedDate: new Date().toISOString().split('T')[0],
      stage: 'applied',
      compensation: applyModalJob.compensation?.amount || 'Competitive',
      nextStep: 'Awaiting recruiter screening or OA assessment',
      notes: applyNotes || 'Applied via Career Pilot AI Discovery.',
    });

    setApplyModalJob(null);
    setApplyNotes('');
    success(
      'Application Recorded! 🚀',
      `${applyModalJob.company} position added to your active application tracker pipeline.`
    );
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setFilterMode('all');
    setFilterMinMatch('all');
    setSortBy('relevance');
  };

  // Helper for rendering eligibility badge
  const renderEligibilityBadge = (verdict?: string) => {
    if (verdict === 'Eligible') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
          <Check className="w-3 h-3 text-emerald-600" /> Academically Eligible
        </span>
      );
    }
    if (verdict === 'Requires Verification') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
          <HelpCircle className="w-3 h-3 text-amber-600" /> Criteria Unverified
        </span>
      );
    }
    if (verdict === 'Not Eligible') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
          <XCircle className="w-3 h-3 text-rose-600" /> Ineligible
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* 1. Clear Demonstration Data Notice Banner */}
      <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 shadow-2xs">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-semibold">Demonstration Placements Active:</strong> The listings shown below
          are simulated opportunities designed for campus recruitment training, skill-gap auditing, and
          deterministic profile matching. They do not represent verified live vacancies with external employers.
        </div>
      </div>

      {/* 2. Top Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Opportunity Discovery & Match Engine
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Discover full-time roles and internships scored deterministically against your verified student skills.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Opportunities
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'saved'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            Saved ({savedJobs.length})
          </button>
        </div>
      </div>

      {/* 3. Search and Filters Bar */}
      <Card className="shadow-2xs border-slate-200">
        <CardContent className="pt-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search job title, company, or tech stack..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Employment Type */}
            <div className="md:col-span-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full py-2 px-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="all">All Employment Types</option>
                <option value="Internship">Internship</option>
                <option value="Full-time">Full-time</option>
                <option value="Co-op">Co-op</option>
              </select>
            </div>

            {/* Work Mode */}
            <div className="md:col-span-2">
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                className="w-full py-2 px-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="all">All Work Modes</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>

            {/* Min Match Filter */}
            <div className="md:col-span-3">
              <select
                value={filterMinMatch}
                onChange={(e) => setFilterMinMatch(e.target.value)}
                className="w-full py-2 px-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="all">Any Match Score</option>
                <option value="60">60%+ Match (Moderate+)</option>
                <option value="80">80%+ Match (High Match)</option>
                <option value="90">90%+ Match (Exceptional)</option>
              </select>
            </div>
          </div>

          {/* Secondary Sorting and Active Filters bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Sort By:
              </span>
              <div className="flex items-center gap-1">
                {(
                  [
                    { key: 'relevance', label: 'Match Relevance' },
                    { key: 'date', label: 'Newest First' },
                    { key: 'deadline', label: 'Closing Soonest' },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSortBy(s.key)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                      sortBy === s.key
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleResetFilters}
              className="text-[11px] text-slate-400 hover:text-indigo-600 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset Filters
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 4. Opportunity Listing Results */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-slate-200/70 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <EmptyState
          title="No Opportunities Found"
          description="Try broadening your search keywords or adjusting your work mode and minimum match filters."
          actionText="Reset Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <div className="space-y-4">
          {opportunities.map((job) => {
            const matchScore = job.match?.matchScore ?? 75;
            const suitability = job.match?.suitability ?? 'Moderate Match';
            const matchedSkills = job.match?.matchedSkills || [];
            const missingSkills = job.match?.missingSkills || [];

            return (
              <Card
                key={job._id}
                className="shadow-2xs hover:shadow-xs hover:border-indigo-300 transition-all border-slate-200"
              >
                <CardContent className="pt-5 space-y-4">
                  {/* Card Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <img
                        src={job.companyLogo}
                        alt={job.company}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                      />
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            onClick={() => navigate(`/jobs/${job.slug || job._id}`)}
                            className="text-base sm:text-lg font-bold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors leading-snug"
                          >
                            {job.title}
                          </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
                          <span className="font-semibold text-slate-800">{job.company}</span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" /> {job.location} ({job.workMode})
                          </span>
                          <span>&bull;</span>
                          <span className="font-semibold text-emerald-700">
                            {job.compensation?.amount}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Action & Match Pill */}
                    <div className="flex items-center gap-3 self-end sm:self-start shrink-0">
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <Badge
                            variant={matchScore >= 80 ? 'success' : matchScore >= 60 ? 'info' : 'warning'}
                            size="sm"
                            dot
                          >
                            {matchScore}% Match
                          </Badge>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{suitability}</div>
                      </div>

                      {/* Bookmark Button */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleSave(e, job)}
                        title={job.isSaved ? 'Remove from saved' : 'Save opportunity'}
                        className="p-2 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {job.isSaved ? (
                          <BookmarkCheck className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Badges and Eligibility Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                      {job.employmentType}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                      {job.workMode}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                      {job.roleCategory}
                    </span>
                    {renderEligibilityBadge(job.match?.eligibility?.verdict)}
                  </div>

                  {/* Matched & Missing Skills Pills */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                    {/* Matching skills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-400">Matched Skills:</span>
                      {matchedSkills.length > 0 ? (
                        matchedSkills.slice(0, 4).map((sk, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100 font-medium text-[11px]"
                          >
                            ✓ {sk.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400">None matched</span>
                      )}
                      {matchedSkills.length > 4 && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          +{matchedSkills.length - 4} more
                        </span>
                      )}
                    </div>

                    {/* Missing skills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-400">Skill Gaps:</span>
                      {missingSkills.length > 0 ? (
                        missingSkills.slice(0, 3).map((sk, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-100 font-medium text-[11px]"
                          >
                            ! {sk.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-medium">Full skill coverage!</span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>
                        Posted {new Date(job.publicationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {job.applicationDeadline && (
                        <span>
                          &bull; Closes {new Date(job.applicationDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => navigate(`/jobs/${job.slug || job._id}`)}
                      >
                        View Details & Eligibility
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        className="bg-indigo-600 hover:bg-indigo-500 text-xs shadow-xs"
                        onClick={() => setApplyModalJob(job)}
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        Track / Apply
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* 5. Pagination Bar */}
          {activeTab === 'all' && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 pb-2 text-xs text-slate-600 border-t border-slate-200">
              <span className="font-medium text-slate-500">
                Showing Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} Total Opportunities)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => fetchOpportunities(pagination.page - 1)}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!pagination.hasNextPage}
                  onClick={() => fetchOpportunities(pagination.page + 1)}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Track Application Modal */}
      {applyModalJob && (
        <Modal
          isOpen={true}
          onClose={() => setApplyModalJob(null)}
          title={`Track Opportunity — ${applyModalJob.company}`}
          description="Record this position in your student placement application tracker board."
          size="md"
        >
          <form onSubmit={handleConfirmApply} className="space-y-4 py-2">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
              <div>
                <strong>Position:</strong> {applyModalJob.title}
              </div>
              <div>
                <strong>Company:</strong> {applyModalJob.company}
              </div>
              <div>
                <strong>Location:</strong> {applyModalJob.location} ({applyModalJob.workMode})
              </div>
              <div>
                <strong>Compensation:</strong> {applyModalJob.compensation?.amount}
              </div>
              <div>
                <strong>Student Match:</strong> {applyModalJob.match?.matchScore ?? 75}%
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Application Notes / Referral Contact (Optional)
              </label>
              <textarea
                rows={3}
                value={applyNotes}
                onChange={(e) => setApplyNotes(e.target.value)}
                placeholder="e.g. Applied via university handshake link; recruiter review in progress."
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* External URL notice */}
            <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 flex items-center justify-between">
              <span>External Company Career Portal</span>
              <a
                href={sanitizeExternalUrl(applyModalJob.applicationUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <span>Open Application Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="ghost" size="sm" onClick={() => setApplyModalJob(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Confirm & Add to Tracker
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
