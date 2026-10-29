import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  PlayCircle,
  Code2,
  Brain,
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Clock,
  Building2,
  RotateCcw,
  AlertCircle,
  TrendingUp,
  Award,
  Layers,
  History,
  Check,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { SearchBar } from '../components/common/SearchBar';
import { Tabs } from '../components/common/Tabs';
import { Input } from '../components/common/FormControls';
import { useToast } from '../context/ToastContext';
import { useStudentData } from '../context/StudentDataContext';
import { interviewService } from '../services/interview.service';
import {
  IInterviewSession,
  InterviewType,
  InterviewDifficulty,
  StudentSessionStats,
} from '../types/interview.types';

interface QuestionItem {
  id: string;
  title: string;
  category: 'dsa' | 'system_design' | 'behavioral' | 'company';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  company: string;
  topic: string;
  timeEstimate: string;
  prompt: string;
  hint: string;
}

const staticQuestions: QuestionItem[] = [
  {
    id: 'q_1',
    title: 'Design an Idempotent Payment Webhook Receiver',
    category: 'system_design',
    difficulty: 'Medium',
    company: 'Stripe',
    topic: 'API Design & Concurrency',
    timeEstimate: '35 mins',
    prompt:
      'When third-party webhooks fire, network retries can send duplicate events. Design a stateless Node.js endpoint using Redis locks or database unique constraints to guarantee idempotency.',
    hint: 'Generate an event signature hash, check Redis with SETNX and a 24-hour TTL before executing payment state mutations.',
  },
  {
    id: 'q_2',
    title: 'Longest Substring Without Repeating Characters',
    category: 'dsa',
    difficulty: 'Medium',
    company: 'Google',
    topic: 'Sliding Window & Hash Maps',
    timeEstimate: '25 mins',
    prompt:
      'Given a string s, find the length of the longest substring without duplicate characters. Analyze time and space complexity.',
    hint: 'Maintain two pointers (left and right) and a character frequency map. Advance the left pointer when duplicates are encountered.',
  },
  {
    id: 'q_3',
    title: 'Behavioral: Tell Me About a Conflict With a Team Member',
    category: 'behavioral',
    difficulty: 'Easy',
    company: 'Amazon',
    topic: 'STAR Method & Disagree and Commit',
    timeEstimate: '15 mins',
    prompt:
      'Describe a situation during a group project where you strongly disagreed with an architectural decision. How did you handle the situation and what was the outcome?',
    hint: 'Structure using Situation -> Task -> Action -> Result. Emphasize data-driven trade-off analysis over personal opinion.',
  },
  {
    id: 'q_4',
    title: 'Design a Real-Time Distributed Rate Limiter',
    category: 'system_design',
    difficulty: 'Hard',
    company: 'Datadog',
    topic: 'Distributed Systems & Token Bucket',
    timeEstimate: '45 mins',
    prompt:
      'Design a high-throughput API rate limiting service that restricts incoming client IPs to 100 requests per minute across a cluster of 20 API servers.',
    hint: 'Compare Sliding Window Log, Token Bucket, and Leaky Bucket. Discuss how Redis Lua scripts guarantee atomic decrement.',
  },
  {
    id: 'q_5',
    title: 'Binary Tree Level Order Traversal (BFS)',
    category: 'dsa',
    difficulty: 'Medium',
    company: 'Microsoft',
    topic: 'Trees & Queues',
    timeEstimate: '20 mins',
    prompt:
      'Given the root of a binary tree, return the level order traversal of its nodes values (i.e. from left to right, level by level).',
    hint: 'Use a FIFO Queue. For each iteration, process queue.length elements to cleanly separate tree levels.',
  },
  {
    id: 'q_6',
    title: 'Behavioral: Describe a Challenging Bug You Debugged',
    category: 'behavioral',
    difficulty: 'Medium',
    company: 'Meta',
    topic: 'Technical Deep Dive & Resilience',
    timeEstimate: '15 mins',
    prompt:
      'Walk through a production or project issue that took significant time to isolate. How did you inspect logs, formulate hypotheses, and verify the fix?',
    hint: 'Demonstrate scientific isolation: reproducing locally, adding targeted instrumentation, examining memory or latency flamegraphs.',
  },
];

const PRESET_TOPICS: Record<InterviewType, string[]> = {
  technical: [
    'React & Frontend Architecture',
    'REST APIs & Idempotency',
    'PostgreSQL & Database Design',
    'System Scalability & Caching',
    'Docker & Microservices',
    'Data Structures & Algorithms',
  ],
  hr: [
    'STAR: Conflict Resolution',
    'STAR: Handling Critical Deadlines',
    'STAR: Learning from Mistakes',
    'Career Motivation & Goals',
    'Leadership & Ownership',
  ],
};

export const InterviewPrepPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useStudentData();
  const { success, error, info } = useToast();

  // Wizard state
  const [targetRole, setTargetRole] = useState<string>('Full-Stack Developer');
  const [interviewType, setInterviewType] = useState<InterviewType>('technical');
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>('Intermediate');
  const [questionCount, setQuestionCount] = useState<number>(3);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isStarting, setIsStarting] = useState<boolean>(false);

  // Active session & stats state
  const [activeSession, setActiveSession] = useState<IInterviewSession | null>(null);
  const [stats, setStats] = useState<StudentSessionStats | null>(null);
  const [sessionHistory, setSessionHistory] = useState<IInterviewSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Question bank browse state
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [openHintId, setOpenHintId] = useState<string | null>(null);

  // Initialize role from profile if available
  useEffect(() => {
    if (profile?.targetRoles && profile.targetRoles.length > 0) {
      setTargetRole(profile.targetRoles[0]);
    }
  }, [profile]);

  // Load active session, stats & history
  const loadInterviewData = useCallback(async () => {
    try {
      setLoading(true);
      const [current, sessionStats, history] = await Promise.all([
        interviewService.getCurrentSession(),
        interviewService.getSessionStats().catch(() => null),
        interviewService.getStudentSessions().catch(() => []),
      ]);

      setActiveSession(current);
      setStats(sessionStats);
      setSessionHistory(history);
    } catch (err) {
      console.error('Failed to load interview data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInterviewData();
  }, [loadInterviewData]);

  // Launch new mock interview session
  const handleStartInterview = async () => {
    if (!targetRole.trim()) {
      error('Target Role Required', 'Please enter a target career role for your interview.');
      return;
    }

    try {
      setIsStarting(true);
      const session = await interviewService.createSession({
        targetRole: targetRole.trim(),
        interviewType,
        difficulty,
        questionCount,
        topics: selectedTopics,
      });

      success('Interview Started', `Generated ${session.totalQuestions} questions for ${session.targetRole}.`);
      navigate(`/interview-session?sessionId=${session._id}`);
    } catch (err) {
      error('Failed to start interview', (err as Error).message);
    } finally {
      setIsStarting(false);
    }
  };

  // Abandon active session
  const handleAbandonSession = async () => {
    if (!activeSession) return;
    try {
      await interviewService.abandonSession(activeSession._id);
      setActiveSession(null);
      info('Session Dismissed', 'You can start a fresh interview session whenever you are ready.');
    } catch (err) {
      error('Failed to abandon session', (err as Error).message);
    }
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const filteredQuestions = useMemo(() => {
    return staticQuestions.filter((q) => {
      const matchesCategory = activeCategory === 'all' || q.category === activeCategory;
      const matchesDifficulty = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;
      const matchesSearch =
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.topic.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesDifficulty && matchesSearch;
    });
  }, [activeCategory, selectedDifficulty, searchQuery]);

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Interview Preparation</h1>
            <Badge variant="info" size="sm">
              Role-Specific Simulator
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Practice interactive technical and behavioral (HR) interviews with transparent rubrics, instant scoring, and model answers.
          </p>
        </div>
      </div>

      {/* Active In-Progress Session Recovery Banner */}
      {activeSession && (
        <div className="p-5 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">In-Progress Practice Session</span>
                <Badge variant="info" size="sm">
                  Question {activeSession.currentQuestionIndex + 1} of {activeSession.totalQuestions}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {activeSession.targetRole} • {activeSession.interviewType.toUpperCase()} ({activeSession.difficulty})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleAbandonSession}
              className="text-xs text-slate-500"
            >
              Abandon
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => navigate(`/interview-session?sessionId=${activeSession._id}`)}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Resume Interview
            </Button>
          </div>
        </div>
      )}

      {/* Aggregate Student Performance Stats Bar */}
      {stats && stats.completedSessions > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-slate-200 text-center py-4">
            <CardContent className="p-0 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Completed Sessions
              </span>
              <div className="text-2xl font-extrabold text-slate-900">{stats.completedSessions}</div>
              <p className="text-[10px] text-slate-500">Across {stats.totalQuestionsAnswered} answered questions</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 text-center py-4">
            <CardContent className="p-0 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Average Score
              </span>
              <div className="text-2xl font-extrabold text-indigo-600">{stats.averageOverallScore}%</div>
              <p className="text-[10px] text-slate-500">Criteria-based average</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 text-center py-4">
            <CardContent className="p-0 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Technical Average
              </span>
              <div className="text-2xl font-extrabold text-emerald-600">
                {stats.technicalAverage > 0 ? `${stats.technicalAverage}%` : 'N/A'}
              </div>
              <p className="text-[10px] text-slate-500">Architecture & Mechanics</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 text-center py-4">
            <CardContent className="p-0 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Behavioral Average
              </span>
              <div className="text-2xl font-extrabold text-amber-600">
                {stats.hrAverage > 0 ? `${stats.hrAverage}%` : 'N/A'}
              </div>
              <p className="text-[10px] text-slate-500">STAR Method & Outcomes</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Setup Card: Start New Interview Session */}
      <Card className="shadow-2xs border-slate-200">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <CardTitle className="text-base sm:text-lg">Configure AI Mock Interview Session</CardTitle>
          </div>
          <CardDescription>
            Select your interview format, difficulty level, and optional topics to generate targeted questions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Target Role */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Target Career Role *</label>
              <Input
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Full-Stack Developer, Data Scientist, DevOps Engineer"
              />
              {profile?.targetRoles && profile.targetRoles.length > 1 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10.5px] text-slate-500">From your profile:</span>
                  {profile.targetRoles.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setTargetRole(r)}
                      className={`text-[10.5px] px-2 py-0.5 rounded font-medium border ${
                        targetRole === r
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Interview Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Interview Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setInterviewType('technical');
                    setSelectedTopics([]);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    interviewType === 'technical'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <Code2 className="w-4 h-4 text-indigo-600" />
                    <span>Technical Round</span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 font-normal mt-0.5">
                    Architecture, algorithms, debugging & systems
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setInterviewType('hr');
                    setSelectedTopics([]);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    interviewType === 'hr'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    <span>HR & Behavioral</span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 font-normal mt-0.5">
                    STAR method, teamwork, conflict & culture
                  </p>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
            {/* Difficulty Level */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Difficulty Level</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Beginner', 'Intermediate', 'Advanced'] as InterviewDifficulty[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficulty(lvl)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      difficulty === lvl
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Number of Questions</label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 5, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuestionCount(num)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      questionCount === num
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 border-2'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {num} Questions
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Optional Topic Selection */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-700 block">
              Optional Focus Topics ({PRESET_TOPICS[interviewType].length} available)
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_TOPICS[interviewType].map((topic) => {
                const isSelected = selectedTopics.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTopic(topic)}
                    className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white font-medium'
                        : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{topic}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              size="md"
              variant="primary"
              onClick={handleStartInterview}
              isLoading={isStarting}
              leftIcon={<PlayCircle className="w-4 h-4" />}
            >
              Start Interactive Mock Interview
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Past Completed Interview Sessions */}
      {sessionHistory.length > 0 && (
        <Card className="shadow-2xs">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-600" />
              <CardTitle className="text-base">Practice History & Evaluation Reports</CardTitle>
            </div>
            <CardDescription>Review your past answers, AI criteria evaluations, and model answers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {sessionHistory.slice(0, 5).map((session) => (
              <div
                key={session._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{session.targetRole}</span>
                    <Badge variant={session.interviewType === 'technical' ? 'info' : 'warning'} size="sm">
                      {session.interviewType.toUpperCase()}
                    </Badge>
                    <Badge variant="neutral" size="sm">
                      {session.difficulty}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {new Date(session.createdAt).toLocaleDateString()} at{' '}
                    {new Date(session.createdAt).toLocaleTimeString()} • {session.questions.length} Questions
                  </span>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {session.status === 'completed' && session.summary ? (
                    <Badge variant={session.summary.overallScore >= 75 ? 'success' : 'warning'} size="sm">
                      {session.summary.overallScore}% Overall Score
                    </Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">
                      {session.status}
                    </Badge>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/interview-session?sessionId=${session._id}`)}
                    className="text-xs"
                  >
                    {session.status === 'completed' ? 'View Report' : 'Resume'}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Curated Question Bank Section */}
      <div className="space-y-4 pt-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Curated Role Question Catalog</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Explore frequent questions, architectural trade-offs, and STAR guidance across Tier-1 tech interviews.
          </p>
        </div>

        {/* Filter and Mode Tabs */}
        <Tabs
          variant="line"
          activeTab={activeCategory}
          onChange={setActiveCategory}
          tabs={[
            { id: 'all', label: 'All Questions', badge: staticQuestions.length },
            { id: 'dsa', label: 'Data Structures & Algorithms' },
            { id: 'system_design', label: 'System Design & APIs' },
            { id: 'behavioral', label: 'Behavioral & STAR' },
          ]}
        />

        {/* Search & Difficulty Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by topic, keyword, or company (e.g. Stripe, Google)..."
          />

          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
            <span className="text-xs font-semibold text-slate-500 uppercase">Difficulty:</span>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            >
              <option value="all">All Levels</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Question Bank Cards */}
        <div className="space-y-3">
          {filteredQuestions.map((q) => {
            const isHintOpen = openHintId === q.id;

            return (
              <Card key={q.id} className="shadow-2xs hover:border-slate-300 transition-all">
                <CardContent className="pt-5 sm:p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-slate-900">{q.title}</span>
                      <Badge
                        variant={
                          q.difficulty === 'Easy'
                            ? 'success'
                            : q.difficulty === 'Medium'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {q.difficulty}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {q.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {q.timeEstimate}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs font-medium text-indigo-600 font-mono">
                    Topic: {q.topic}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{q.prompt}</p>

                  {/* Collapsible Solution Hint */}
                  {isHintOpen && (
                    <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 space-y-1 animate-in fade-in duration-150">
                      <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Suggested Architectural Approach:
                      </div>
                      <p className="leading-relaxed">{q.hint}</p>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={() => setOpenHintId(isHintOpen ? null : q.id)}
                      className="font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                    >
                      {isHintOpen ? 'Hide Approach Hint' : 'View Approach Hint'}
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${isHintOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setTargetRole(q.topic);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-xs"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Practice in Simulator
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
