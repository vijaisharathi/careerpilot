import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code2,
  Terminal,
  Award,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  Sparkles,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Input, Select } from '../components/common/FormControls';
import { ProgressBar } from '../components/common/ProgressBar';
import { Spinner } from '../components/common/Spinner';
import { codingService } from '../services/coding.service';
import {
  CodingQuestionSummary,
  CodingAssessmentItem,
  StudentSkillSummaryData,
  SandboxStatusData,
} from '../types/coding.types';
import { useToast } from '../context/ToastContext';

export const CodingHubPage: React.FC = () => {
  const navigate = useNavigate();
  const { error: toastError, success: toastSuccess } = useToast();

  const [activeTab, setActiveTab] = useState<'questions' | 'assessments' | 'submissions'>('questions');
  const [questions, setQuestions] = useState<CodingQuestionSummary[]>([]);
  const [assessments, setAssessments] = useState<CodingAssessmentItem[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [skillSummary, setSkillSummary] = useState<StudentSkillSummaryData | null>(null);
  const [sandboxStatus, setSandboxStatus] = useState<SandboxStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [questionsRes, assessmentsRes, skillRes, sandboxRes, subRes] = await Promise.all([
        codingService.getQuestions({
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
          search: searchQuery.trim() || undefined,
          limit: 20,
        }),
        codingService.getAssessments({ limit: 10 }),
        codingService.getStudentSkillSummary(),
        codingService.getExecutionEngineStatus(),
        codingService.getSubmissions({ limit: 10 }),
      ]);

      setQuestions(questionsRes.questions);
      setAssessments(assessmentsRes.assessments);
      setSkillSummary(skillRes);
      setSandboxStatus(sandboxRes);
      setSubmissions(subRes.submissions);
    } catch (err) {
      toastError('Failed to load coding data', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, difficultyFilter, searchQuery, toastError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStartAssessment = async (assessmentId: string) => {
    try {
      const attempt = await codingService.startAttempt(assessmentId);
      toastSuccess('Session Started', 'Assessment attempt initialized.');
      navigate(`/coding/assessment/${attempt.id || (attempt as any)._id}`);
    } catch (err) {
      toastError('Cannot Start Assessment', (err as Error).message);
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200">Easy</Badge>;
      case 'Medium':
        return <Badge variant="warning" className="bg-amber-50 text-amber-700 border-amber-200">Medium</Badge>;
      case 'Hard':
        return <Badge variant="danger" className="bg-rose-50 text-rose-700 border-rose-200">Hard</Badge>;
      default:
        return <Badge variant="neutral">{difficulty}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Coding Assessment &amp; Skill Hub
            </h1>
            <Badge variant="primary" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
              <Cpu className="h-3 w-3" />
              <span>Isolated Sandbox</span>
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Practice algorithmic challenges, test code in isolated runtimes, and complete verified technical assessments.
          </p>
        </div>

        {sandboxStatus && (
          <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-lg text-xs text-slate-600 border border-slate-200">
            <Terminal className="h-4 w-4 text-emerald-600" />
            <span>
              Engine: <strong className="text-slate-800 uppercase">{sandboxStatus.provider}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Technical Skill Profile Widget */}
      {skillSummary && (
        <Card className="border border-slate-200/80 shadow-sm bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Verified Technical Skill Profile
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  Technical Proficiency Summary
                </h2>
                <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                  Computed dynamically from verified submission results across algorithms, data structures, and programming fundamentals.
                </p>
              </div>

              <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-700/80 pt-4 md:pt-0 md:pl-8">
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-emerald-400">
                    {skillSummary.overallCodingScore}
                    <span className="text-xs font-semibold text-slate-400 ml-0.5">/100</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mt-0.5">
                    Coding Score
                  </div>
                </div>

                <div className="text-center border-l border-slate-700/80 pl-6">
                  <div className="text-3xl font-extrabold text-white">
                    {skillSummary.totalProblemsSolved}
                  </div>
                  <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mt-0.5">
                    Solved
                  </div>
                </div>

                <div className="text-center border-l border-slate-700/80 pl-6">
                  <div className="text-3xl font-extrabold text-slate-300">
                    {skillSummary.totalSubmissions}
                  </div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    Submissions
                  </div>
                </div>
              </div>
            </div>

            {/* Category Proficiencies */}
            {skillSummary.categoryProficiencies.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {skillSummary.categoryProficiencies.map((cat, i) => (
                  <div key={i} className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/60">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-200 truncate">{cat.category}</span>
                      <span className="text-emerald-400 font-bold">{cat.accuracyPercentage}%</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mb-1.5">
                      {cat.problemsSolved} solved • {cat.proficiencyLevel}
                    </div>
                    <ProgressBar value={cat.accuracyPercentage} variant="success" className="h-1.5 bg-slate-700" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('questions')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'questions'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Code2 className="h-4 w-4" />
          <span>Practice Question Bank ({questions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('assessments')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'assessments'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Zap className="h-4 w-4" />
          <span>Timed &amp; Role Assessments ({assessments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('submissions')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'submissions'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>My Submissions ({submissions.length})</span>
        </button>
      </div>

      {/* Tab 1: Practice Questions */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {/* Filters */}
          <Card className="border border-slate-200/80 shadow-sm">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by problem title or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 text-xs"
                  />
                </div>

                <div>
                  <Select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="text-xs"
                  >
                    <option value="all">All Topic Categories</option>
                    <option value="Programming Fundamentals">Programming Fundamentals</option>
                    <option value="Arrays & Strings">Arrays &amp; Strings</option>
                    <option value="Searching & Sorting">Searching &amp; Sorting</option>
                    <option value="Recursion">Recursion</option>
                    <option value="Algorithms">Algorithms</option>
                    <option value="Data Structures">Data Structures</option>
                    <option value="SQL Fundamentals">SQL Fundamentals</option>
                  </Select>
                </div>

                <div>
                  <Select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="text-xs"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Spinner size="lg" className="text-emerald-600 mb-3" />
              <p className="text-xs font-medium text-slate-500">Loading coding questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
              <Code2 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-semibold text-slate-900">No questions found</h3>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search keywords.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {questions.map((q) => (
                <Card
                  key={q._id || q.id}
                  className="border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-500">{q.category}</span>
                      {getDifficultyBadge(q.difficulty)}
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-900 hover:text-emerald-700 transition-colors">
                        {q.title}
                      </h3>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {q.topicTags.map((tag, i) => (
                          <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <span>Langs:</span>
                        <span className="font-mono font-medium text-slate-600">
                          {q.supportedLanguages.join(', ')}
                        </span>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/coding/practice/${q.slug}`)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-2.5 flex items-center gap-1"
                      >
                        <span>Solve</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Timed & Role Assessments */}
      {activeTab === 'assessments' && (
        <div className="space-y-4">
          {assessments.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
              <Zap className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-semibold text-slate-900">No active assessments scheduled</h3>
              <p className="text-xs text-slate-500 mt-1">Check back soon for new placement tests.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assessments.map((a) => (
                <Card key={a._id || a.id} className="border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="primary" className="bg-emerald-50 text-emerald-800 border-emerald-200 uppercase tracking-wider text-[10px]">
                        {a.type.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {a.durationMinutes > 0 ? `${a.durationMinutes} mins` : 'Untimed'}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-slate-900">{a.title}</h3>
                      {a.targetRole && (
                        <p className="text-xs text-emerald-700 font-semibold mt-0.5">Role: {a.targetRole}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{a.description}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <div>Questions: <strong>{a.questions.length}</strong></div>
                      <div>Total Marks: <strong>{a.totalMarks}</strong></div>
                      <div>Pass Mark: <strong>{a.passingMarks}</strong></div>
                    </div>

                    <div className="pt-2">
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => handleStartAssessment(a._id || (a as any).id)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      >
                        Start Assessment Attempt
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Submissions */}
      {activeTab === 'submissions' && (
        <Card className="border border-slate-200/80 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {submissions.length === 0 ? (
              <div className="text-center py-16 px-4">
                <CheckCircle2 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h3 className="text-sm font-semibold text-slate-900">No submissions yet</h3>
                <p className="text-xs text-slate-500 mt-1">Solve problems in the Practice tab to build your record.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase">
                      <th className="py-3 px-4">Problem</th>
                      <th className="py-3 px-4">Language</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Passed Cases</th>
                      <th className="py-3 px-4 text-center">Score</th>
                      <th className="py-3 px-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {submissions.map((s) => (
                      <tr key={s._id || s.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {s.questionId?.title || 'Coding Problem'}
                        </td>
                        <td className="py-3 px-4 font-mono uppercase text-slate-600">{s.language}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={s.status === 'accepted' ? 'success' : 'danger'}
                            className="uppercase text-[10px]"
                          >
                            {s.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center font-medium">
                          {s.passedTestCasesCount} / {s.totalTestCasesCount}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-700">
                          {s.scoreAwarded} / {s.maxScore}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-400">
                          {new Date(s.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

