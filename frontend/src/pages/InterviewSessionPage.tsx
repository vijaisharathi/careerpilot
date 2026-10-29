import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Code2,
  MessageSquare,
  Send,
  HelpCircle,
  ChevronDown,
  Info,
  Award,
  ChevronLeft,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { ProgressBar } from '../components/common/ProgressBar';
import { Textarea } from '../components/common/FormControls';
import { useToast } from '../context/ToastContext';
import { interviewService } from '../services/interview.service';
import {
  IInterviewSession,
  IInterviewQuestion,
} from '../types/interview.types';

export const InterviewSessionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error, info } = useToast();

  const [session, setSession] = useState<IInterviewSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showModelAnswer, setShowModelAnswer] = useState<boolean>(false);

  // Timer states
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(true);

  // Active question index in session view
  const [viewQuestionIndex, setViewQuestionIndex] = useState<number>(0);

  // Load session from query string or current active session
  const loadSession = useCallback(async () => {
    try {
      setLoading(true);
      const searchParams = new URLSearchParams(location.search);
      const queryId = searchParams.get('sessionId');

      let loaded: IInterviewSession | null = null;
      if (queryId) {
        loaded = await interviewService.getSessionById(queryId);
      } else {
        loaded = await interviewService.getCurrentSession();
      }

      if (loaded) {
        setSession(loaded);
        setViewQuestionIndex(loaded.currentQuestionIndex);
        const currentQ = loaded.questions[loaded.currentQuestionIndex];
        if (currentQ?.studentAnswer) {
          setCurrentAnswer(currentQ.studentAnswer);
        } else {
          setCurrentAnswer('');
        }
      }
    } catch (err) {
      error('Failed to load session', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [location.search, error]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Timer interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerActive && session && session.status === 'in_progress') {
      interval = setInterval(() => {
        setElapsedSeconds((sec) => sec + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, session]);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Submit Answer handler
  const handleSubmitAnswer = async () => {
    if (!session) return;
    if (!currentAnswer.trim() || currentAnswer.trim().length < 5) {
      error('Answer Required', 'Please provide an answer (at least 5 characters).');
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await interviewService.submitAnswer(
        session._id,
        viewQuestionIndex,
        currentAnswer.trim()
      );

      setSession(updated);
      success(
        'Answer Evaluated',
        `Question ${viewQuestionIndex + 1} scored: ${
          updated.questions[viewQuestionIndex]?.evaluation?.overallScore || 0
        }%`
      );
    } catch (err) {
      error('Evaluation Failed', (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Move to next question
  const handleNextQuestion = () => {
    if (!session) return;
    const nextIdx = viewQuestionIndex + 1;
    if (nextIdx < session.questions.length) {
      setViewQuestionIndex(nextIdx);
      const nextQ = session.questions[nextIdx];
      setCurrentAnswer(nextQ.studentAnswer || '');
      setShowHint(false);
      setShowModelAnswer(false);
    }
  };

  // Move to previous question
  const handlePrevQuestion = () => {
    if (!session) return;
    const prevIdx = viewQuestionIndex - 1;
    if (prevIdx >= 0) {
      setViewQuestionIndex(prevIdx);
      const prevQ = session.questions[prevIdx];
      setCurrentAnswer(prevQ.studentAnswer || '');
      setShowHint(false);
      setShowModelAnswer(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-600">Loading your interview simulator...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">No Active Interview Session</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          You don't have an ongoing interview session. Start a new technical or HR interview session from the preparation hub.
        </p>
        <Button size="sm" variant="primary" onClick={() => navigate('/interview-prep')}>
          Go to Interview Preparation
        </Button>
      </div>
    );
  }

  const currentQuestion = session.questions[viewQuestionIndex];
  const isQuestionEvaluated = Boolean(currentQuestion?.evaluation);
  const isSessionCompleted = session.status === 'completed';

  // ==========================================
  // VIEW: COMPLETED SESSION SUMMARY
  // ==========================================
  if (isSessionCompleted && viewQuestionIndex >= session.questions.length) {
    const summary = session.summary;

    return (
      <div className="space-y-8 pb-16 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Interview Session Summary
              </h1>
              <Badge variant="success" size="sm">
                Completed
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Performance audit for {session.targetRole} • {session.interviewType.toUpperCase()} ({session.difficulty})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setViewQuestionIndex(0)}
              className="text-xs"
            >
              Review Questions
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => navigate('/interview-prep')}
              className="text-xs"
            >
              Back to Interview Hub
            </Button>
          </div>
        </div>

        {/* Scorecard Overview */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30 text-center py-6">
              <CardContent className="space-y-2 p-0">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Overall Score
                </span>
                <div className="text-4xl font-extrabold text-indigo-700">{summary.overallScore}%</div>
                <Badge
                  variant={summary.overallScore >= 75 ? 'success' : 'warning'}
                  size="sm"
                  className="mx-auto"
                >
                  {summary.overallScore >= 80 ? 'Interview Ready' : 'Developing Match'}
                </Badge>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="pt-5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-600">Correctness / Relevance</span>
                  <span className="font-bold text-slate-900">{summary.averageCorrectness}%</span>
                </div>
                <ProgressBar
                  value={summary.averageCorrectness}
                  variant={summary.averageCorrectness >= 70 ? 'success' : 'warning'}
                />
                <p className="text-[10px] text-slate-500">Technical accuracy & situational fit</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="pt-5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-600">Completeness</span>
                  <span className="font-bold text-slate-900">{summary.averageCompleteness}%</span>
                </div>
                <ProgressBar
                  value={summary.averageCompleteness}
                  variant={summary.averageCompleteness >= 70 ? 'success' : 'warning'}
                />
                <p className="text-[10px] text-slate-500">Coverage of core concepts</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="pt-5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-600">Clarity & Structure</span>
                  <span className="font-bold text-slate-900">{summary.averageClarity}%</span>
                </div>
                <ProgressBar
                  value={summary.averageClarity}
                  variant={summary.averageClarity >= 70 ? 'success' : 'warning'}
                />
                <p className="text-[10px] text-slate-500">Articulation & STAR coherence</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed Feedback & Recommendations */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Key Strengths */}
            <Card className="border-emerald-100 bg-emerald-50/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <CardTitle className="text-sm text-emerald-950">Demonstrated Strengths</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {summary.keyStrengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Areas for Improvement */}
            <Card className="border-amber-100 bg-amber-50/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <CardTitle className="text-sm text-amber-950">Targeted Practice Areas</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {summary.areasForImprovement.map((area, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Overall Recommendation Callout */}
        {summary && (
          <Card className="shadow-2xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">Evaluator Verdict & Advice</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {summary.overallRecommendation}
              </p>
              <p className="text-[11px] text-slate-500 italic">
                Note: Mock interview evaluations provide formative guidance based on recruiting rubrics. Communication and behavioral indicators should be used for iterative practice rather than taken as objective hiring guarantees.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW: FOCUSED QUESTION & EVALUATION WORKSPACE
  // ==========================================
  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Session Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/interview-prep')}
            className="p-1.5 text-slate-500"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">{session.targetRole}</span>
              <Badge variant={session.interviewType === 'technical' ? 'info' : 'warning'} size="sm">
                {session.interviewType.toUpperCase()}
              </Badge>
              <Badge variant="neutral" size="sm">
                {session.difficulty}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500">
              Question {viewQuestionIndex + 1} of {session.totalQuestions}
            </p>
          </div>
        </div>

        {/* Controls: Timer & Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={viewQuestionIndex === 0}
              onClick={handlePrevQuestion}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={viewQuestionIndex === session.questions.length - 1}
              onClick={handleNextQuestion}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {isSessionCompleted && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setViewQuestionIndex(session.questions.length)}
              className="text-xs"
            >
              Summary
            </Button>
          )}
        </div>
      </div>

      {/* Question Card */}
      <Card className="shadow-2xs border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider font-mono">
              Topic: {currentQuestion.topic}
            </span>
            <span className="text-[11px] text-slate-400">
              Question {viewQuestionIndex + 1} of {session.totalQuestions}
            </span>
          </div>
          <CardTitle className="text-base sm:text-lg text-slate-900 leading-snug">
            {currentQuestion.questionText}
          </CardTitle>
          {currentQuestion.contextOrScenario && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 mt-2 leading-relaxed">
              <strong className="text-slate-800">Scenario Context: </strong>
              {currentQuestion.contextOrScenario}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {/* Collapsible Approach Hint */}
          {currentQuestion.hints && currentQuestion.hints.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {showHint ? 'Hide Guidance Hint' : 'Show Guidance Hint'}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showHint ? 'rotate-180' : ''}`} />
              </button>

              {showHint && (
                <div className="mt-2 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-950 space-y-1">
                  <div className="font-bold text-indigo-900">Approach Guidance:</div>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {currentQuestion.hints.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Student Text Answer Submission Area */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Your Response</span>
              <span className="text-slate-400 font-normal">
                {currentAnswer.split(/\s+/).filter(Boolean).length} words • {currentAnswer.length} chars
              </span>
            </div>

            <Textarea
              rows={7}
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder={
                session.interviewType === 'technical'
                  ? 'Explain the technical mechanics, architecture, trade-offs, and edge cases...'
                  : 'Structure your response using the STAR method (Situation, Task, Action, Result)...'
              }
              helperText={
                session.interviewType === 'technical'
                  ? 'Evaluated on technical accuracy, completeness of expected concepts, and structural clarity.'
                  : 'Evaluated on STAR structure, concrete personal ownership, and quantifiable outcomes.'
              }
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Text-based interview mode • Voice recognition disabled
              </span>

              <Button
                size="md"
                variant="primary"
                onClick={handleSubmitAnswer}
                isLoading={isSubmitting}
                leftIcon={<Send className="w-4 h-4" />}
              >
                {isQuestionEvaluated ? 'Re-Evaluate Answer' : 'Submit for AI Evaluation'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Post-Submission Instant Criteria Evaluation Card */}
      {isQuestionEvaluated && currentQuestion.evaluation && (
        <Card className="shadow-2xs border-indigo-200 bg-white space-y-4 animate-in fade-in duration-300">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <CardTitle className="text-base text-slate-900">
                  Question {viewQuestionIndex + 1} Evaluation
                </CardTitle>
                <Badge
                  variant={currentQuestion.evaluation.overallScore >= 75 ? 'success' : 'warning'}
                  size="sm"
                >
                  {currentQuestion.evaluation.overallScore}% Score
                </Badge>
              </div>

              {currentQuestion.evaluation.isUncertainAssessment && (
                <Badge variant="warning" size="sm">
                  Uncertain Assessment (Brief Answer)
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-0">
            {/* Criteria Scores Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10.5px] font-bold text-slate-500 uppercase">Correctness</span>
                <div className="text-lg font-bold text-slate-900">
                  {currentQuestion.evaluation.correctness}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10.5px] font-bold text-slate-500 uppercase">Completeness</span>
                <div className="text-lg font-bold text-slate-900">
                  {currentQuestion.evaluation.completeness}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10.5px] font-bold text-slate-500 uppercase">Clarity</span>
                <div className="text-lg font-bold text-slate-900">
                  {currentQuestion.evaluation.clarity}%
                </div>
              </div>
            </div>

            {/* Strengths & Missing Concepts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 p-3.5 rounded-xl bg-emerald-50/30 border border-emerald-100">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Key Strengths
                </span>
                <ul className="space-y-1 text-slate-700 pl-4 list-disc">
                  {currentQuestion.evaluation.strengths.map((str, i) => (
                    <li key={i}>{str}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1.5 p-3.5 rounded-xl bg-amber-50/30 border border-amber-100">
                <span className="font-bold text-amber-950 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> Missing Concepts to Cover
                </span>
                {currentQuestion.evaluation.missingConcepts.length > 0 ? (
                  <ul className="space-y-1 text-slate-700 pl-4 list-disc">
                    {currentQuestion.evaluation.missingConcepts.map((mis, i) => (
                      <li key={i}>{mis}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-emerald-700 font-medium">All expected key concepts covered!</p>
                )}
              </div>
            </div>

            {/* Constructive Feedback */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
              <strong className="text-slate-900 font-bold block">Constructive Feedback:</strong>
              <p className="leading-relaxed">{currentQuestion.evaluation.feedback}</p>
            </div>

            {/* Suggested Improved Model Answer */}
            <div>
              <button
                type="button"
                onClick={() => setShowModelAnswer(!showModelAnswer)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {showModelAnswer ? 'Hide Model Answer' : 'View Suggested Model Answer'}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showModelAnswer ? 'rotate-180' : ''}`} />
              </button>

              {showModelAnswer && (
                <div className="mt-2 p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 text-xs text-indigo-950 space-y-1">
                  <span className="font-bold text-indigo-900 block">Senior-Level Reference Answer:</span>
                  <p className="leading-relaxed font-sans">{currentQuestion.evaluation.suggestedImprovedAnswer}</p>
                </div>
              )}
            </div>

            {/* Transparent Rubric Explanation Notice */}
            <p className="text-[11px] text-slate-500 italic">
              {currentQuestion.evaluation.rubricExplanation}
            </p>
          </CardContent>

          <CardFooter className="pt-3 border-t border-slate-100 flex justify-between">
            <span className="text-xs text-slate-500">
              Evaluated at {new Date(currentQuestion.answeredAt || Date.now()).toLocaleTimeString()}
            </span>

            {viewQuestionIndex < session.questions.length - 1 ? (
              <Button
                size="sm"
                variant="primary"
                onClick={handleNextQuestion}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Proceed to Question {viewQuestionIndex + 2}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setViewQuestionIndex(session.questions.length)}
                rightIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                View Full Session Summary
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
};
