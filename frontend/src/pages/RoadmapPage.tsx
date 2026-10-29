import React, { useState, useMemo } from 'react';
import {
  Map,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  BookOpen,
  Code2,
  Sparkles,
  Award,
  Layers,
  Calendar,
  Settings2,
  RefreshCw,
  Search,
  Filter,
  Check,
  ChevronDown,
  ChevronUp,
  FolderGit2,
  Terminal,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { ProgressBar } from '../components/common/ProgressBar';
import { Modal } from '../components/common/Modal';
import { useStudentData } from '../context/StudentDataContext';
import { useToast } from '../context/ToastContext';
import { BackendRoadmapTask, RoadmapTaskType } from '../types/roadmap.types';
import { sanitizeExternalUrl } from '../utils/url';

export const RoadmapPage: React.FC = () => {
  const {
    activeRoadmap,
    isRoadmapLoading,
    generatePersonalizedRoadmap,
    toggleRoadmapTaskStatus,
    updateRoadmapSchedule,
    regeneratePersonalizedRoadmap,
    rolesCatalog,
    profile,
  } = useStudentData();

  const { success, error: toastError } = useToast();

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedPhases, setCollapsedPhases] = useState<Record<number, boolean>>({});

  // Modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleHours, setScheduleHours] = useState(activeRoadmap?.weeklyHours || 10);
  const [scheduleWeeks, setScheduleWeeks] = useState(activeRoadmap?.totalWeeks || 8);
  const [isUpdatingSchedule, setIsUpdatingSchedule] = useState(false);

  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [selectedRoleSlug, setSelectedRoleSlug] = useState(
    activeRoadmap?.targetRole.slug || 'full-stack-developer'
  );
  const [preserveProgress, setPreserveProgress] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Toggle phase accordion
  const togglePhaseCollapse = (phaseNumber: number) => {
    setCollapsedPhases((prev) => ({
      ...prev,
      [phaseNumber]: !prev[phaseNumber],
    }));
  };

  // Handle task completion toggle
  const handleToggleTask = async (task: BackendRoadmapTask) => {
    try {
      const nextState = !task.completed;
      await toggleRoadmapTaskStatus(task._id, nextState);
      if (nextState) {
        success('Task Completed! 🎉', `"${task.title}" marked as complete.`);
      }
    } catch (err) {
      toastError('Action Failed', (err as Error).message || 'Could not update task status.');
    }
  };

  // Handle initial generation if no roadmap exists
  const handleGenerateInitial = async () => {
    try {
      await generatePersonalizedRoadmap({
        targetRoleSlug: profile.targetRoles[0] ? profile.targetRoles[0].toLowerCase().replace(/\s+/g, '-') : 'full-stack-developer',
        weeklyHours: 10,
        totalWeeks: 8,
      });
      success('Roadmap Generated! 🚀', 'Your personalized learning roadmap is ready.');
    } catch (err) {
      toastError('Generation Failed', (err as Error).message || 'Failed to generate roadmap.');
    }
  };

  // Handle schedule save
  const handleSaveSchedule = async () => {
    setIsUpdatingSchedule(true);
    try {
      await updateRoadmapSchedule({
        weeklyHours: Number(scheduleHours),
        totalWeeks: Number(scheduleWeeks),
      });
      success('Schedule Updated! ⏱️', `Study target set to ${scheduleHours}h/week across ${scheduleWeeks} weeks.`);
      setIsScheduleModalOpen(false);
    } catch (err) {
      toastError('Update Failed', (err as Error).message || 'Failed to update schedule.');
    } finally {
      setIsUpdatingSchedule(false);
    }
  };

  // Handle regeneration
  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await regeneratePersonalizedRoadmap({
        targetRoleSlug: selectedRoleSlug,
        weeklyHours: activeRoadmap?.weeklyHours || 10,
        totalWeeks: activeRoadmap?.totalWeeks || 8,
        preserveProgress,
      });
      success(
        'Roadmap Regenerated! 🌟',
        `Curriculum updated for ${selectedRoleSlug}. ${preserveProgress ? 'Completed tasks preserved.' : ''}`
      );
      setIsRegenerateModalOpen(false);
    } catch (err) {
      toastError('Regeneration Failed', (err as Error).message || 'Failed to regenerate roadmap.');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Helper for task type badges
  const getTaskTypeBadge = (type: RoadmapTaskType) => {
    switch (type) {
      case 'Concept':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md">
            <BookOpen className="w-3 h-3 text-indigo-600" /> Concept
          </span>
        );
      case 'Hands-on Exercise':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-700 bg-cyan-50 border border-cyan-200/80 px-2 py-0.5 rounded-md">
            <Terminal className="w-3 h-3 text-cyan-600" /> Hands-on Exercise
          </span>
        );
      case 'Project':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
            <FolderGit2 className="w-3 h-3 text-emerald-600" /> Capstone Project
          </span>
        );
      case 'DSA':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-md">
            <Code2 className="w-3 h-3 text-purple-600" /> Algorithm / DSA
          </span>
        );
      case 'Reading':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
            <FileText className="w-3 h-3 text-amber-600" /> System Design & Reading
          </span>
        );
      case 'Assessment':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-md">
            <Award className="w-3 h-3 text-rose-600" /> Mock Interview Screen
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
            {type}
          </span>
        );
    }
  };

  // Filter tasks based on search and status
  const filteredPhases = useMemo(() => {
    if (!activeRoadmap) return [];

    return activeRoadmap.phases.map((phase) => {
      const filteredWeeks = phase.weeks.map((week) => {
        const filteredTasks = week.tasks.filter((task) => {
          // Status filter
          if (statusFilter === 'completed' && !task.completed) return false;
          if (statusFilter === 'pending' && task.completed) return false;

          // Search query
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            const matchTitle = task.title.toLowerCase().includes(query);
            const matchObjective = task.learningObjective.toLowerCase().includes(query);
            const matchType = task.type.toLowerCase().includes(query);
            return matchTitle || matchObjective || matchType;
          }
          return true;
        });

        return {
          ...week,
          tasks: filteredTasks,
        };
      });

      return {
        ...phase,
        weeks: filteredWeeks,
      };
    });
  }, [activeRoadmap, statusFilter, searchQuery]);

  // Loading skeleton state
  if (isRoadmapLoading && !activeRoadmap) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-pulse">
        <div className="h-20 bg-slate-200/70 rounded-2xl w-full" />
        <div className="h-32 bg-slate-200/70 rounded-2xl w-full" />
        <div className="space-y-4">
          <div className="h-44 bg-slate-200/70 rounded-2xl w-full" />
          <div className="h-44 bg-slate-200/70 rounded-2xl w-full" />
        </div>
      </div>
    );
  }

  // Empty state when no roadmap has been generated yet
  if (!activeRoadmap) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <Card className="border-indigo-100 shadow-sm text-center p-8 sm:p-12 bg-gradient-to-b from-indigo-50/40 via-white to-slate-50">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-600/30">
            <Map className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Personalized Learning Roadmap
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto mt-2 leading-relaxed">
            Convert your target career requirements and verified skill gaps into an actionable, week-by-week
            curriculum with curated official documentation and capstone exercises.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
              onClick={handleGenerateInitial}
              isLoading={isRoadmapLoading}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Generate My Learning Roadmap
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const overallPercent = activeRoadmap.overallProgress || 0;
  const completedTasks = activeRoadmap.completedTasks || 0;
  const totalTasks = activeRoadmap.totalTasks || 1;

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      {/* 1. Header & Quick Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Adaptive Learning Roadmap
            </h1>
            <Badge variant="info" size="sm">
              {activeRoadmap.targetRole.title}
            </Badge>
            <span className="text-xs text-slate-400 font-mono">
              v{activeRoadmap.version}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Sequenced milestone modules designed to close target competency gaps before campus placement drives.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="text-xs text-slate-700 hover:border-indigo-300"
            onClick={() => {
              setScheduleHours(activeRoadmap.weeklyHours);
              setScheduleWeeks(activeRoadmap.totalWeeks);
              setIsScheduleModalOpen(true);
            }}
            leftIcon={<Settings2 className="w-3.5 h-3.5 text-slate-500" />}
          >
            Adjust Schedule ({activeRoadmap.weeklyHours}h/wk)
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-500 text-xs shadow-xs"
            onClick={() => {
              setSelectedRoleSlug(activeRoadmap.targetRole.slug);
              setIsRegenerateModalOpen(true);
            }}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Regenerate Plan
          </Button>
        </div>
      </div>

      {/* 2. Progress Summary Card */}
      <Card className="shadow-2xs bg-gradient-to-r from-indigo-50/50 via-white to-slate-50 border-indigo-100">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Overall Roadmap Velocity
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
                {completedTasks} / {totalTasks} Tasks Completed{' '}
                <span className="text-indigo-600 font-mono text-lg font-bold">
                  ({overallPercent}%)
                </span>
              </div>
            </div>

            <div className="text-right sm:text-right">
              <div className="text-xs text-slate-500">Pace Budget</div>
              <div className="text-xs font-semibold text-slate-700 font-mono">
                {activeRoadmap.weeklyHours} hrs/week &bull; {activeRoadmap.totalWeeks} Weeks Total
              </div>
            </div>
          </div>

          <ProgressBar value={overallPercent} size="md" variant="primary" />

          {/* Phase Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100 text-xs">
            {activeRoadmap.phases.map((p) => (
              <div
                key={p.phaseNumber}
                className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      p.status === 'completed'
                        ? 'bg-emerald-600 text-white'
                        : p.status === 'in-progress'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {p.status === 'completed' ? '✓' : p.phaseNumber}
                  </span>
                  <span className="font-semibold text-slate-700 truncate max-w-[130px]">
                    Phase {p.phaseNumber}
                  </span>
                </div>
                <span className="font-mono text-slate-500 font-medium">
                  {p.progress}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 3. Search and Status Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tasks, topics, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0 justify-end">
          <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {(['all', 'pending', 'completed'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                statusFilter === filter
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Sequenced Phases & Weeks Timeline */}
      <div className="space-y-6">
        {filteredPhases.map((phase) => {
          const isCollapsed = !!collapsedPhases[phase.phaseNumber];
          const phaseTasks = phase.weeks.flatMap((w) => w.tasks);
          const completedInPhase = phaseTasks.filter((t) => t.completed).length;

          return (
            <Card
              key={phase.phaseNumber}
              className={`shadow-xs transition-all ${
                phase.status === 'completed'
                  ? 'border-emerald-200 bg-emerald-50/10'
                : phase.status === 'in-progress'
                ? 'border-indigo-300 ring-1 ring-indigo-500/20 bg-white'
                : 'border-slate-200 bg-white'
              }`}
            >
              <CardHeader
                className="cursor-pointer select-none pb-4"
                onClick={() => togglePhaseCollapse(phase.phaseNumber)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          phase.status === 'completed'
                            ? 'bg-emerald-600 text-white'
                            : phase.status === 'in-progress'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {phase.status === 'completed' ? '✓' : phase.phaseNumber}
                      </span>
                      <CardTitle className="text-base sm:text-lg">
                        {phase.title}
                      </CardTitle>
                      <Badge
                        variant={
                          phase.status === 'completed'
                            ? 'success'
                            : phase.status === 'in-progress'
                            ? 'info'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {phase.status.toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription className="pl-8 text-xs sm:text-sm">
                      {phase.description}
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-4 pl-8 sm:pl-0 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-mono font-semibold text-slate-700">
                        {completedInPhase} / {phaseTasks.length} Done ({phase.progress}%)
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {phase.weeks.length} Weeks Sprint
                      </div>
                    </div>
                    <button
                      type="button"
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    >
                      {isCollapsed ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronUp className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </CardHeader>

              {!isCollapsed && (
                <CardContent className="space-y-6 pt-0 pl-4 sm:pl-12">
                  {phase.weeks.map((week) => (
                    <div
                      key={week.weekNumber}
                      className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/40 p-4"
                    >
                      {/* Week Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-100/70 text-indigo-800 text-[11px] font-bold font-mono">
                            Week {week.weekNumber}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                            {week.theme}
                          </h4>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {week.tasks.filter((t) => t.completed).length} / {week.tasks.length} tasks
                        </span>
                      </div>

                      {/* Tasks List */}
                      <div className="space-y-3">
                        {week.tasks.map((task) => (
                          <div
                            key={task._id}
                            className={`p-3.5 rounded-xl border transition-all ${
                              task.completed
                                ? 'border-emerald-200 bg-emerald-50/30'
                                : 'border-slate-200/90 bg-white hover:border-indigo-300 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              {/* Left Checkbox & Title */}
                              <div className="flex items-start gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTask(task)}
                                  aria-label={task.completed ? 'Mark pending' : 'Mark complete'}
                                  className="mt-0.5 text-slate-400 hover:text-indigo-600 focus:outline-none transition-colors"
                                >
                                  {task.completed ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-400 shrink-0" />
                                  )}
                                </button>

                                <div className="space-y-1.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={`text-xs sm:text-sm font-bold ${
                                        task.completed
                                          ? 'text-slate-600 line-through'
                                          : 'text-slate-900'
                                      }`}
                                    >
                                      {task.title}
                                    </span>
                                    {getTaskTypeBadge(task.type)}
                                  </div>

                                  {/* Learning Objective */}
                                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <strong className="text-slate-700">Objective:</strong>{' '}
                                    {task.learningObjective}
                                  </p>

                                  {/* Verified Resources List */}
                                  {task.resources && task.resources.length > 0 && (
                                    <div className="pt-1 flex flex-wrap items-center gap-2">
                                      <span className="text-[11px] font-medium text-slate-400">
                                        Verified Material:
                                      </span>
                                      {task.resources.map((res, rIdx) => (
                                        <a
                                          key={rIdx}
                                          href={sanitizeExternalUrl(res.url)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline bg-indigo-50/70 border border-indigo-100 px-2 py-0.5 rounded-md"
                                        >
                                          <span>{res.provider}: {res.title}</span>
                                          <ExternalLink className="w-3 h-3 text-indigo-400" />
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right Estimated Duration */}
                              <div className="text-right shrink-0 flex items-center gap-1 text-slate-500 font-mono text-[11px] pt-0.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{task.estimatedMinutes}m</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Modal 1: Adjust Schedule */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Adjust Learning Pace & Study Budget"
        description="Configure your weekly available study hours and target roadmap duration to fit your semester workload."
      >
        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Weekly Study Hours: {scheduleHours} hrs/week</span>
              <span className="font-mono text-indigo-600">~{scheduleHours * 60} mins</span>
            </div>
            <input
              type="range"
              min="3"
              max="40"
              step="1"
              value={scheduleHours}
              onChange={(e) => setScheduleHours(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>3h (Light)</span>
              <span>10h (Balanced)</span>
              <span>20h (Intensive)</span>
              <span>40h (Full-time)</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Target Duration (Weeks)
            </label>
            <select
              value={scheduleWeeks}
              onChange={(e) => setScheduleWeeks(Number(e.target.value))}
              className="w-full p-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {[4, 6, 8, 10, 12, 16, 20, 24].map((w) => (
                <option key={w} value={w}>
                  {w} Weeks ({Math.round(w / 4)} months curriculum)
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsScheduleModalOpen(false)}
              disabled={isUpdatingSchedule}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500"
              onClick={handleSaveSchedule}
              isLoading={isUpdatingSchedule}
            >
              Save Schedule
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 2: Regenerate Roadmap */}
      <Modal
        isOpen={isRegenerateModalOpen}
        onClose={() => setIsRegenerateModalOpen(false)}
        title="Regenerate Personalized Roadmap"
        description="Re-align your learning sprint to a target career role and re-sequence modules to close newly identified skill gaps."
      >
        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Target Career Role
            </label>
            <select
              value={selectedRoleSlug}
              onChange={(e) => setSelectedRoleSlug(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {rolesCatalog.length > 0 ? (
                rolesCatalog.map((role) => (
                  <option key={role.slug} value={role.slug}>
                    {role.title} ({role.category})
                  </option>
                ))
              ) : (
                <option value="full-stack-developer">Full-Stack Developer</option>
              )}
            </select>
          </div>

          {/* Preserve Progress Toggle */}
          <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/40 flex items-start gap-3">
            <input
              type="checkbox"
              id="preserveCheck"
              checked={preserveProgress}
              onChange={(e) => setPreserveProgress(e.target.checked)}
              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="preserveCheck" className="text-xs space-y-0.5 cursor-pointer select-none">
              <span className="font-bold text-slate-900 block">
                Preserve completed tasks (Recommended)
              </span>
              <span className="text-slate-600 block text-[11px] leading-relaxed">
                Retains completion credit for all equivalent topics and tasks you have already finished, so you never lose progress.
              </span>
            </label>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRegenerateModalOpen(false)}
              disabled={isRegenerating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500"
              onClick={handleRegenerate}
              isLoading={isRegenerating}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Regenerate Roadmap
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
