import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Send,
  Code2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Cpu,
  HelpCircle,
  Award,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/FormControls';
import { Spinner } from '../components/common/Spinner';
import { CodeEditor } from '../components/coding/CodeEditor';
import { codingService } from '../services/coding.service';
import {
  CodingQuestionDetail,
  SupportedLanguage,
  RunSampleResult,
  CodeSubmissionResult,
} from '../types/coding.types';
import { useToast } from '../context/ToastContext';

export const CodingWorkspacePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const [question, setQuestion] = useState<CodingQuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<SupportedLanguage>('python');
  const [code, setCode] = useState<string>('');

  // Execution states
  const [runningSample, setRunningSample] = useState(false);
  const [sampleResult, setSampleResult] = useState<RunSampleResult | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<CodeSubmissionResult | null>(null);

  const [activeResultTab, setActiveResultTab] = useState<'sample' | 'submission' | 'ai'>('sample');
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<any>(null);
  const [showHints, setShowHints] = useState(false);

  const loadQuestion = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const data = await codingService.getQuestionDetail(slug);
      setQuestion(data);

      const initialLang: SupportedLanguage = data.supportedLanguages?.[0] || 'python';
      setLanguage(initialLang);
      const starter = data.starterCode?.[initialLang] || '';
      setCode(starter);
    } catch (err) {
      toastError('Failed to load problem', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [slug, toastError]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    if (question?.starterCode?.[newLang]) {
      setCode(question.starterCode[newLang] || '');
    }
  };

  const handleRunSample = async () => {
    if (!question) return;
    setRunningSample(true);
    setActiveResultTab('sample');
    try {
      const result = await codingService.runSampleCode({
        questionId: question._id || (question as any).id,
        language,
        sourceCode: code,
      });
      setSampleResult(result);
      if (result.status === 'accepted') {
        toastSuccess('Sample Tests Passed', `${result.passedSampleCases}/${result.totalSampleCases} passed.`);
      } else {
        toastError('Tests Failed', `Status: ${result.status.replace('_', ' ')}`);
      }
    } catch (err) {
      toastError('Execution Failed', (err as Error).message);
    } finally {
      setRunningSample(false);
    }
  };

  const handleSubmit = async () => {
    if (!question) return;
    setSubmitting(true);
    setActiveResultTab('submission');
    try {
      const result = await codingService.submitSolution({
        questionId: question._id || (question as any).id,
        language,
        sourceCode: code,
      });
      setSubmissionResult(result);
      if (result.status === 'accepted') {
        toastSuccess('Solution Accepted!', `All ${result.totalTestCasesCount} test cases passed.`);
      } else {
        toastError('Submission Unsuccessful', `Status: ${result.status.replace('_', ' ')}`);
      }
    } catch (err) {
      toastError('Submission Failed', (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGetAiGuidance = async () => {
    if (!submissionResult) {
      toastError('Submission Needed', 'Submit your solution once to receive educational AI feedback.');
      return;
    }
    setLoadingAi(true);
    setActiveResultTab('ai');
    try {
      const feedback = await codingService.requestAiFeedback(
        submissionResult._id || (submissionResult as any).id
      );
      setAiFeedback(feedback);
      toastSuccess('AI Tutor Guidance', 'Pedagogical feedback generated.');
    } catch (err) {
      toastError('AI Unavailable', (err as Error).message);
    } finally {
      setLoadingAi(false);
    }
  };

  if (loading || !question) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Spinner size="lg" className="text-emerald-600 mb-3" />
        <p className="text-xs font-medium text-slate-500">Loading coding workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/coding')}
            className="text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            <span>Problem Catalog</span>
          </Button>
          <div className="h-4 w-px bg-slate-200" />
          <h1 className="text-base font-bold text-slate-900">{question.title}</h1>
          <Badge
            variant={
              question.difficulty === 'Easy'
                ? 'success'
                : question.difficulty === 'Medium'
                ? 'warning'
                : 'danger'
            }
          >
            {question.difficulty}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-32">
            <Select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
              className="text-xs font-mono"
            >
              {question.supportedLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRunSample}
            disabled={runningSample || submitting}
            className="text-xs flex items-center gap-1.5 border-slate-300"
          >
            {runningSample ? <Spinner size="sm" /> : <Play className="h-3.5 w-3.5 text-slate-700" />}
            <span>Run Sample</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || runningSample}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1.5"
          >
            {submitting ? <Spinner size="sm" /> : <Send className="h-3.5 w-3.5" />}
            <span>Submit Solution</span>
          </Button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Panel: Problem Spec (5 cols) */}
        <div className="lg:col-span-5 space-y-4 max-h-[820px] overflow-y-auto pr-1">
          <Card className="border border-slate-200/80 shadow-sm">
            <CardHeader className="py-3 px-5 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Problem Description
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="whitespace-pre-line font-normal">{question.description}</div>

              {/* Format & Constraints */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div>
                  <span className="font-bold text-slate-800 uppercase text-[10px]">Input Format:</span>
                  <div className="font-mono text-[11px] text-slate-600 mt-0.5">{question.inputFormat}</div>
                </div>
                <div>
                  <span className="font-bold text-slate-800 uppercase text-[10px]">Output Format:</span>
                  <div className="font-mono text-[11px] text-slate-600 mt-0.5">{question.outputFormat}</div>
                </div>
                <div>
                  <span className="font-bold text-slate-800 uppercase text-[10px]">Constraints:</span>
                  <div className="font-mono text-[11px] text-slate-600 mt-0.5 whitespace-pre-line">{question.constraints}</div>
                </div>
              </div>

              {/* Sample Test Cases */}
              <div className="space-y-3">
                <span className="font-bold text-slate-800 uppercase text-[10px]">Sample Test Cases:</span>
                {question.sampleTestCases.map((tc, idx) => (
                  <div key={idx} className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-[11px] space-y-1.5">
                    <div>
                      <span className="text-slate-500 uppercase text-[9px] block">Input</span>
                      <pre className="text-emerald-300 whitespace-pre-wrap">{tc.input}</pre>
                    </div>
                    <div className="pt-1 border-t border-slate-800">
                      <span className="text-slate-500 uppercase text-[9px] block">Expected Output</span>
                      <pre className="text-white whitespace-pre-wrap">{tc.output}</pre>
                    </div>
                    {tc.explanation && (
                      <p className="text-[10px] text-slate-400 font-sans italic pt-1">{tc.explanation}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Hints Accordion */}
              {question.hints && question.hints.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowHints(!showHints)}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <span>Algorithmic Hints ({question.hints.length})</span>
                    {showHints ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>

                  {showHints && (
                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                      {question.hints.map((h, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Code Editor & Result Dock (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <CodeEditor
            language={language}
            code={code}
            onChange={setCode}
            starterCode={question.starterCode?.[language]}
            className="min-h-[420px]"
          />

          {/* Result Dock Tabs */}
          <Card className="border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50/80 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveResultTab('sample')}
                  className={`font-semibold pb-1 border-b-2 transition-colors ${
                    activeResultTab === 'sample'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sample Execution
                </button>
                <button
                  type="button"
                  onClick={() => setActiveResultTab('submission')}
                  className={`font-semibold pb-1 border-b-2 transition-colors ${
                    activeResultTab === 'submission'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Full Submission
                </button>
                <button
                  type="button"
                  onClick={() => setActiveResultTab('ai')}
                  className={`font-semibold pb-1 border-b-2 transition-colors flex items-center gap-1 ${
                    activeResultTab === 'ai'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Sparkles className="h-3 w-3 text-emerald-600" />
                  <span>AI Tutor Guidance</span>
                </button>
              </div>

              {submissionResult && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGetAiGuidance}
                  disabled={loadingAi}
                  className="text-xs text-emerald-700 hover:bg-emerald-50 h-6 px-2 font-semibold"
                >
                  {loadingAi ? <Spinner size="sm" /> : <Sparkles className="h-3 w-3 mr-1" />}
                  <span>Ask AI Tutor</span>
                </Button>
              )}
            </div>

            <CardContent className="p-4 text-xs font-mono min-h-[160px]">
              {/* Tab 1: Sample Execution Results */}
              {activeResultTab === 'sample' && (
                <div>
                  {!sampleResult ? (
                    <div className="text-center py-8 text-slate-400 font-sans">
                      <Play className="h-8 w-8 mx-auto text-slate-300 mb-1" />
                      <p>Click "Run Sample" to evaluate code against public sample cases.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between font-sans">
                        <Badge
                          variant={sampleResult.status === 'accepted' ? 'success' : 'danger'}
                          className="uppercase tracking-wider text-[11px]"
                        >
                          {sampleResult.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-slate-500 text-[11px]">
                          Passed {sampleResult.passedSampleCases} of {sampleResult.totalSampleCases} samples ({sampleResult.executionDurationMs} ms)
                        </span>
                      </div>

                      {sampleResult.compilationError && (
                        <div className="p-3 bg-rose-950 text-rose-300 rounded-lg text-xs whitespace-pre-wrap">
                          {sampleResult.compilationError}
                        </div>
                      )}

                      <div className="space-y-2">
                        {sampleResult.testCaseResults.map((tc, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-lg border text-xs ${
                              tc.isPassed ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                            }`}
                          >
                            <div className="flex justify-between font-sans font-semibold mb-1">
                              <span>Sample #{i + 1}</span>
                              <span>{tc.executionTimeMs} ms</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <span className="text-slate-500 block">Input:</span>
                                <span className="text-slate-200">{tc.input}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Expected:</span>
                                <span className="text-slate-200">{tc.expectedOutput}</span>
                              </div>
                            </div>
                            {tc.actualOutput && (
                              <div className="mt-1 pt-1 border-t border-slate-800">
                                <span className="text-slate-500 block">Your Output:</span>
                                <span className="text-white">{tc.actualOutput}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Full Submission Results */}
              {activeResultTab === 'submission' && (
                <div>
                  {!submissionResult ? (
                    <div className="text-center py-8 text-slate-400 font-sans">
                      <Send className="h-8 w-8 mx-auto text-slate-300 mb-1" />
                      <p>Click "Submit Solution" to run against the complete test suite.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 font-sans">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div>
                          <Badge
                            variant={submissionResult.status === 'accepted' ? 'success' : 'danger'}
                            className="uppercase text-xs font-bold"
                          >
                            {submissionResult.status.replace('_', ' ')}
                          </Badge>
                          <div className="text-xs text-slate-600 mt-1">
                            Passed <strong>{submissionResult.passedTestCasesCount}</strong> of{' '}
                            <strong>{submissionResult.totalTestCasesCount}</strong> test cases
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xl font-extrabold text-emerald-700">
                            {submissionResult.scoreAwarded} / {submissionResult.maxScore}
                          </div>
                          <div className="text-[10px] text-slate-400">Score Awarded</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 font-mono">
                        {submissionResult.testCaseResults.map((tc) => (
                          <div
                            key={tc.testCaseIndex}
                            className={`p-2 rounded text-center text-xs font-bold border ${
                              tc.isPassed
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            #{tc.testCaseIndex} {tc.isPassed ? '✓' : '✗'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: AI Tutor Guidance */}
              {activeResultTab === 'ai' && (
                <div className="font-sans">
                  {loadingAi ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Spinner size="md" className="text-emerald-600 mb-2" />
                      <p className="text-xs text-slate-500">Generating pedagogical code analysis...</p>
                    </div>
                  ) : !aiFeedback ? (
                    <div className="text-center py-8 text-slate-400">
                      <Sparkles className="h-8 w-8 mx-auto text-emerald-400 mb-1" />
                      <p className="text-xs">Submit a solution and click "Ask AI Tutor" for personalized hints and complexity optimization.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 text-xs leading-relaxed text-slate-700">
                      <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                        <div className="font-bold text-emerald-900 mb-1">Code Explanation:</div>
                        <p>{aiFeedback.explanation}</p>
                      </div>

                      {aiFeedback.mistakeAnalysis && (
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <div className="font-bold text-amber-900 mb-1">Mistake Analysis:</div>
                          <p>{aiFeedback.mistakeAnalysis}</p>
                        </div>
                      )}

                      {aiFeedback.optimizationSuggestion && (
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="font-bold text-slate-900 mb-1">Complexity &amp; Optimizations:</div>
                          <p>{aiFeedback.optimizationSuggestion}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

