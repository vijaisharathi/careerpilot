import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Code2,
  Send,
  Play,
  RotateCcw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/FormControls';
import { Spinner } from '../components/common/Spinner';
import { CodeEditor } from '../components/coding/CodeEditor';
import { codingService } from '../services/coding.service';
import {
  AssessmentAttemptData,
  SupportedLanguage,
  CodingQuestionDetail,
} from '../types/coding.types';
import { useToast } from '../context/ToastContext';

export const CodingAssessmentAttemptPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const [attempt, setAttempt] = useState<AssessmentAttemptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Active question editor states
  const [activeQuestion, setActiveQuestion] = useState<any>(null);
  const [language, setLanguage] = useState<SupportedLanguage>('python');
  const [code, setCode] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);

  const loadAttempt = useCallback(async () => {
    if (!attemptId) return;
    setLoading(true);
    try {
      const data = await codingService.getAttempt(attemptId);
      setAttempt(data);

      const exp = new Date(data.expiresAt).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((exp - now) / 1000));
      setTimeLeftSeconds(remaining);

      if (data.questionSubmissions && data.questionSubmissions.length > 0) {
        const firstQ: any = data.questionSubmissions[0].questionId;
        setActiveQuestion(firstQ);
        setCode(firstQ?.starterCode?.python || '');
      }
    } catch (err) {
      toastError('Failed to load session', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [attemptId, toastError]);

  useEffect(() => {
    loadAttempt();
  }, [loadAttempt]);

  const handleFinishAttempt = useCallback(
    async (force = false) => {
      if (!attemptId) return;
      if (attempt?.status === 'completed') {
        navigate('/coding');
        return;
      }

      if (force || window.confirm('Are you ready to submit and finalize your assessment attempt?')) {
        setFinishing(true);
        try {
          const finalized = await codingService.finishAttempt(attemptId);
          setAttempt(finalized);
          toastSuccess('Assessment Completed', `Final Score: ${finalized.totalScore} marks.`);
        } catch (err) {
          toastError('Failed to finalize attempt', (err as Error).message);
        } finally {
          setFinishing(false);
        }
      }
    },
    [attemptId, attempt?.status, navigate, toastSuccess, toastError]
  );

  // Server-enforced Countdown Timer
  useEffect(() => {
    if (timeLeftSeconds <= 0 || attempt?.status !== 'in_progress') return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishAttempt(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeftSeconds, attempt?.status, handleFinishAttempt]);

  const handleSelectQuestion = (index: number) => {
    if (!attempt || !attempt.questionSubmissions[index]) return;
    setCurrentQuestionIndex(index);
    const q: any = attempt.questionSubmissions[index].questionId;
    setActiveQuestion(q);
    setCode(q?.starterCode?.[language] || '');
  };

  const handleSubmitQuestionSolution = async () => {
    if (!activeQuestion || !attemptId || !attempt) return;
    setSubmitting(true);
    try {
      const qId = activeQuestion._id || activeQuestion.id;
      const result = await codingService.submitSolution({
        questionId: qId,
        language,
        sourceCode: code,
        assessmentId: attempt.assessmentId._id || (attempt.assessmentId as any).id,
        attemptId,
      });

      toastSuccess(
        'Question Submitted',
        `Score: ${result.scoreAwarded}/${result.maxScore} (${result.passedTestCasesCount}/${result.totalTestCasesCount} passed).`
      );

      // Refresh attempt state to reflect new marks
      const updated = await codingService.getAttempt(attemptId);
      setAttempt(updated);
    } catch (err) {
      toastError('Submission Failed', (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading || !attempt) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Spinner size="lg" className="text-emerald-600 mb-3" />
        <p className="text-xs font-medium text-slate-500">Initializing assessment environment...</p>
      </div>
    );
  }

  // Completed State View
  if (attempt.status === 'completed' || attempt.status === 'timed_out') {
    return (
      <Card className="max-w-xl mx-auto border border-slate-200/80 shadow-md text-center py-12 px-6 my-10 space-y-4">
        <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-600" />
        <h2 className="text-2xl font-bold text-slate-900">Assessment Completed</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Your answers have been evaluated and recorded on your technical skill profile.
        </p>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-xs mx-auto">
          <div className="text-3xl font-extrabold text-slate-900">
            {attempt.totalScore}
            <span className="text-sm font-normal text-slate-400"> / {attempt.assessmentId.totalMarks}</span>
          </div>
          <div className="text-xs font-bold text-emerald-700 uppercase mt-1">
            {attempt.passed ? 'PASSED (Exceeded Threshold)' : 'COMPLETED'}
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/coding')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold mt-4"
        >
          Return to Coding Hub
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Assessment Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900 text-white rounded-xl shadow-md">
        <div>
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            {attempt.assessmentId.type.replace('_', ' ')} Assessment Session
          </div>
          <h1 className="text-lg font-bold text-white mt-0.5">{attempt.assessmentId.title}</h1>
        </div>

        <div className="flex items-center gap-4">
          {attempt.assessmentId.durationMinutes > 0 && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-sm font-bold ${
              timeLeftSeconds < 300
                ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
                : 'bg-slate-800 text-emerald-400 border-slate-700'
            }`}>
              <Clock className="h-4 w-4" />
              <span>{formatTimer(timeLeftSeconds)}</span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFinishAttempt()}
            disabled={finishing}
            className="bg-emerald-600 hover:bg-emerald-700 text-white border-none font-semibold text-xs"
          >
            {finishing ? <Spinner size="sm" /> : 'Finalize & Submit'}
          </Button>
        </div>
      </div>

      {/* Question Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {attempt.questionSubmissions.map((qs, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSelectQuestion(i)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              currentQuestionIndex === i
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>Q{i + 1}</span>
            {qs.marksAwarded > 0 && (
              <span className="text-[10px] opacity-80">({qs.marksAwarded} pts)</span>
            )}
          </button>
        ))}
      </div>

      {/* Workspace Grid */}
      {activeQuestion && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Question Spec Panel */}
          <Card className="lg:col-span-5 border border-slate-200/80 shadow-sm max-h-[720px] overflow-y-auto">
            <CardHeader className="py-3 px-5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold text-slate-800 uppercase">
                  Question {currentQuestionIndex + 1}: {activeQuestion.title}
                </CardTitle>
                <Badge variant="neutral">{activeQuestion.difficulty}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs text-slate-700">
              <div className="whitespace-pre-line leading-relaxed">{activeQuestion.description}</div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200 font-mono text-[11px] space-y-1.5">
                <div>Constraints: {activeQuestion.constraints}</div>
                <div>Time Limit: {activeQuestion.timeLimitMs || 2000} ms</div>
              </div>

              {activeQuestion.sampleTestCases && activeQuestion.sampleTestCases.length > 0 && (
                <div>
                  <span className="font-bold text-slate-800 uppercase text-[10px] block mb-1.5">
                    Sample Test Case:
                  </span>
                  <div className="p-3 bg-slate-900 text-slate-200 rounded font-mono text-[11px] space-y-1">
                    <div>Input: <span className="text-emerald-300">{activeQuestion.sampleTestCases[0].input}</span></div>
                    <div>Expected: <span className="text-white">{activeQuestion.sampleTestCases[0].output}</span></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Code Editor Panel */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-32">
                <Select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                  className="text-xs font-mono"
                >
                  <option value="python">PYTHON</option>
                  <option value="javascript">JAVASCRIPT</option>
                  <option value="java">JAVA</option>
                  <option value="cpp">C++</option>
                </Select>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitQuestionSolution}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                {submitting ? <Spinner size="sm" className="mr-1.5" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                Submit Question {currentQuestionIndex + 1}
              </Button>
            </div>

            <CodeEditor
              language={language}
              code={code}
              onChange={setCode}
              className="min-h-[460px]"
            />
          </div>
        </div>
      )}
    </div>
  );
};

