import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FileCheck,
  Upload,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileText,
  RefreshCw,
  Info,
  Check,
  ArrowUpRight,
  ShieldCheck,
  Briefcase,
  History,
  ChevronRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { ProgressBar } from '../components/common/ProgressBar';
import { Textarea, Input } from '../components/common/FormControls';
import { useToast } from '../context/ToastContext';
import { resumeService } from '../services/resume.service';
import { jobService } from '../services/job.service';
import {
  IResumeAnalysis,
  IResumeDocument,
  IBulletImprovement,
} from '../types/resume.types';
import { SavedJobItem, RequiredSkillItem } from '../types/job.types';

export const ResumeAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error, info } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Input states
  const [analysisMode, setAnalysisMode] = useState<'upload' | 'builder'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resumes, setResumes] = useState<IResumeDocument[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');

  const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>([]);
  const [targetJobTitle, setTargetJobTitle] = useState<string>('Full-Stack Software Engineer');
  const [targetJobDescription, setTargetJobDescription] = useState<string>(
    'We are looking for a Software Engineer proficient in React, TypeScript, Node.js, and Docker. Experience with relational databases like PostgreSQL, cloud deployments on AWS, and CI/CD pipelines is preferred. The ideal candidate will write clean, well-tested code, build microservices, and collaborate on system architecture.'
  );

  // Analysis states
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<IResumeAnalysis | null>(null);
  const [history, setHistory] = useState<IResumeAnalysis[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [applyingBulletIndex, setApplyingBulletIndex] = useState<number | null>(null);

  // Load existing resumes & saved jobs on mount
  useEffect(() => {
    const initData = async () => {
      try {
        const [resumeList, analyses, saved] = await Promise.all([
          resumeService.getResumes().catch(() => []),
          resumeService.getAnalysisHistory().catch(() => []),
          jobService.getSavedJobs().catch(() => []),
        ]);

        setResumes(resumeList);
        setHistory(analyses);
        setSavedJobs(saved);

        // Check if navigated from Resume Builder with selectedResumeId in route state
        const stateResumeId = (location.state as { selectedResumeId?: string })?.selectedResumeId;
        if (stateResumeId) {
          setSelectedResumeId(stateResumeId);
          setAnalysisMode('builder');
        } else if (resumeList.length > 0) {
          setSelectedResumeId(resumeList[0]._id);
        }

        if (analyses.length > 0) {
          setAnalysisResult((prev) => prev || analyses[0]);
        }
      } catch (err) {
        console.error('Failed to initialize analysis page data:', err);
      }
    };

    initData();
  }, [location.state]);

  // Handle file drop/selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['.pdf', '.docx'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validExtensions.includes(ext)) {
      error('Invalid File Type', 'Please upload a PDF (.pdf) or Word document (.docx).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      error('File Too Large', 'Maximum allowed resume file size is 5MB.');
      return;
    }

    setSelectedFile(file);
    info('File Ready', `Selected "${file.name}" (${(file.size / 1024).toFixed(1)} KB)`);
  };

  // Populate job description from a saved opportunity
  const handleSelectSavedJob = (jobId: string) => {
    const match = savedJobs.find((sj) => sj.jobDetails?._id === jobId || sj.job === jobId);
    if (match && match.jobDetails) {
      const details = match.jobDetails;
      setTargetJobTitle(details.title);
      setTargetJobDescription(
        `${details.title} at ${details.company}\n\n` +
        `Required Skills: ${(details.requiredSkills || []).map((s: RequiredSkillItem) => s.name).join(', ')}\n` +
        `Description: ${details.description}`
      );
      success('Opportunity Linked', `Filled description from ${details.title}`);
    }
  };

  // Trigger ATS Analysis
  const handleRunAnalysis = async () => {
    if (!targetJobDescription.trim() || targetJobDescription.trim().length < 20) {
      error('Job Description Required', 'Please provide a target job description (at least 20 characters).');
      return;
    }

    if (analysisMode === 'upload' && !selectedFile) {
      error('File Required', 'Please select or drop a PDF or DOCX resume to upload.');
      return;
    }

    if (analysisMode === 'builder' && !selectedResumeId) {
      error('Resume Required', 'Please select a resume created in the Resume Builder.');
      return;
    }

    try {
      setIsAnalyzing(true);
      const result = await resumeService.analyzeResume({
        file: analysisMode === 'upload' ? selectedFile || undefined : undefined,
        resumeId: analysisMode === 'builder' ? selectedResumeId : undefined,
        targetJobTitle,
        targetJobDescription,
      });

      setAnalysisResult(result);
      setHistory((prev) => [result, ...prev]);
      success('Audit Complete', `Calculated compatibility score: ${result.scores.overallScore}%`);
    } catch (err) {
      error('Analysis Failed', (err as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Apply suggested bullet into active resume builder document
  const handleApplyBullet = async (bullet: IBulletImprovement, index: number) => {
    if (!selectedResumeId && resumes.length === 0) {
      error('No Builder Resume', 'Create or select a Resume Builder document to apply this edit.');
      return;
    }

    const targetId = selectedResumeId || resumes[0]._id;

    try {
      setApplyingBulletIndex(index);
      await resumeService.applyBulletImprovement(targetId, bullet.original, bullet.suggested);
      bullet.applied = true;
      success('Applied to Resume', 'Updated the bullet point inside your Resume Builder document.');
    } catch (err) {
      error('Failed to apply edit', (err as Error).message);
    } finally {
      setApplyingBulletIndex(null);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Resume ATS & Keyword Analyzer
            </h1>
            <Badge variant="success" size="sm">
              AI & Criteria Engine
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Safely audit your resume against target job postings for parseability, keyword match, and quantified impact.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {history.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowHistory(!showHistory)}
              leftIcon={<History className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              History ({history.length})
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/resume-builder')}
            leftIcon={<FileText className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Open Resume Builder
          </Button>
        </div>
      </div>

      {/* Analysis Configuration Card */}
      <Card className="shadow-2xs border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">1. Configure Resume & Target Role Postings</CardTitle>
          <CardDescription>
            Choose your resume source and enter the job description to run an automated criteria check.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-0">
          {/* Mode Switcher */}
          <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
            <button
              onClick={() => setAnalysisMode('upload')}
              className={`text-xs font-semibold pb-1 border-b-2 transition-all ${
                analysisMode === 'upload'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Upload PDF / DOCX File
            </button>
            <button
              onClick={() => setAnalysisMode('builder')}
              className={`text-xs font-semibold pb-1 border-b-2 transition-all ${
                analysisMode === 'builder'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Analyze Built Resume ({resumes.length})
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Resume Input */}
            <div>
              {analysisMode === 'upload' ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    selectedFile
                      ? 'border-emerald-400 bg-emerald-50/20'
                      : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  {selectedFile ? (
                    <div>
                      <p className="text-xs font-bold text-emerald-800">{selectedFile.name}</p>
                      <p className="text-[11px] text-emerald-600 mt-0.5">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for text extraction
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Click to upload or drag & drop resume file
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Supports PDF (.pdf) and Word documents (.docx) up to 5MB
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Select Resume Document
                  </label>
                  {resumes.length > 0 ? (
                    <select
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {resumes.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.title} (v{r.version} • {r.templateId})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 text-xs text-amber-800 space-y-2">
                      <p>You have not built any resumes yet in Career Pilot AI.</p>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => navigate('/resume-builder')}
                      >
                        Create in Resume Builder
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Job Target Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Target Role Title</label>
                {savedJobs.length > 0 && (
                  <select
                    onChange={(e) => handleSelectSavedJob(e.target.value)}
                    className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-600"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Auto-fill from Saved Jobs...
                    </option>
                    {savedJobs.filter((sj) => sj.jobDetails).map((sj) => (
                      <option key={sj._id} value={sj.jobDetails!._id}>
                        {sj.jobDetails!.title} ({sj.jobDetails!.company})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <Input
                value={targetJobTitle}
                onChange={(e) => setTargetJobTitle(e.target.value)}
                placeholder="e.g. Full-Stack Software Engineer"
              />

              <Textarea
                label="Target Job Description & Requirements"
                rows={4}
                value={targetJobDescription}
                onChange={(e) => setTargetJobDescription(e.target.value)}
                placeholder="Paste the employer's job description, technical requirements, and qualifications here..."
                helperText="Minimum 20 characters required to evaluate keyword alignment."
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Button
              size="md"
              variant="primary"
              onClick={handleRunAnalysis}
              isLoading={isAnalyzing}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              {isAnalyzing ? 'Extracting & Auditing...' : 'Run Comprehensive ATS Audit'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History Drawer Modal */}
      {showHistory && (
        <Card className="border-indigo-100 bg-indigo-50/10 shadow-xs">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Previous Resume Audit Reports</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setShowHistory(false)}>
              Close
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {history.map((item) => (
              <div
                key={item._id}
                onClick={() => {
                  setAnalysisResult(item);
                  setShowHistory(false);
                }}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 cursor-pointer text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900">{item.targetJobTitle}</span>
                  <span className="text-[11px] text-slate-500 block">
                    {new Date(item.createdAt).toLocaleDateString()} • {item.originalFileName || 'Resume Builder'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={item.scores.overallScore >= 75 ? 'success' : 'warning'} size="sm">
                    {item.scores.overallScore}% Score
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Results View */}
      {analysisResult && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* ATS Non-Guarantee Disclaimer Banner */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-600 flex items-start gap-3 text-xs leading-relaxed">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800">Compliance & ATS Transparency Notice: </strong>
              {analysisResult.atsDisclaimer}
            </div>
          </div>

          {/* Main Scorecard Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Overall Score */}
            <Card className="border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30 text-center flex flex-col justify-center py-6">
              <CardContent className="space-y-2 p-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Overall ATS Compatibility
                </span>
                <div className="text-4xl font-extrabold text-indigo-700 tracking-tight">
                  {analysisResult.scores.overallScore}%
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {analysisResult.scores.overallScore >= 80
                    ? 'Excellent ATS alignment'
                    : analysisResult.scores.overallScore >= 65
                    ? 'Moderate alignment; gaps exist'
                    : 'Needs keyword & structure optimization'}
                </p>
              </CardContent>
            </Card>

            {/* Keyword Match Subscore */}
            <Card className="border-slate-200">
              <CardContent className="pt-5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-600">Keyword Match</span>
                  <span className="font-bold text-slate-900">{analysisResult.scores.keywordMatchScore}%</span>
                </div>
                <ProgressBar
                  value={analysisResult.scores.keywordMatchScore}
                  variant={analysisResult.scores.keywordMatchScore >= 70 ? 'success' : 'warning'}
                />
                <p className="text-[10.5px] text-slate-500">
                  {analysisResult.matchedKeywords.length} matched, {analysisResult.missingKeywords.length} missing
                </p>
              </CardContent>
            </Card>

            {/* Section Completeness Subscore */}
            <Card className="border-slate-200">
              <CardContent className="pt-5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-600">Section Completeness</span>
                  <span className="font-bold text-slate-900">
                    {analysisResult.scores.sectionCompletenessScore}%
                  </span>
                </div>
                <ProgressBar
                  value={analysisResult.scores.sectionCompletenessScore}
                  variant={analysisResult.scores.sectionCompletenessScore >= 80 ? 'success' : 'warning'}
                />
                <p className="text-[10.5px] text-slate-500">
                  Contact, Skills, Experience & Academic sections
                </p>
              </CardContent>
            </Card>

            {/* Impact & Quantification Subscore */}
            <Card className="border-slate-200">
              <CardContent className="pt-5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-600">Action & Metric Density</span>
                  <span className="font-bold text-slate-900">{analysisResult.scores.impactScore}%</span>
                </div>
                <ProgressBar
                  value={analysisResult.scores.impactScore}
                  variant={analysisResult.scores.impactScore >= 70 ? 'success' : 'warning'}
                />
                <p className="text-[10.5px] text-slate-500">
                  Presence of numbers, percentages, and strong verbs
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Keywords Breakdown (Matched vs Missing) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matched Keywords */}
            <Card className="border-emerald-100 bg-emerald-50/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <CardTitle className="text-sm text-emerald-950">
                    Matched Target Keywords ({analysisResult.matchedKeywords.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {analysisResult.matchedKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.matchedKeywords.map((kw, i) => (
                      <Badge key={i} variant="success" size="sm">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No direct keyword overlap found.</p>
                )}
              </CardContent>
            </Card>

            {/* Missing Keywords */}
            <Card className="border-amber-100 bg-amber-50/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <CardTitle className="text-sm text-amber-950">
                    Missing Target Skills ({analysisResult.missingKeywords.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {analysisResult.missingKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.missingKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded-md font-semibold bg-white border border-amber-200 text-amber-900 shadow-2xs"
                      >
                        + {kw}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-emerald-700 font-medium">
                    All major target keywords identified in resume!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Section Completeness Audit Checklist */}
          <Card className="shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Section Completeness & ATS Parseability Checklist</CardTitle>
              <CardDescription>
                Recruiter parsing algorithms look for standardized sections and clear contact data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analysisResult.sectionFeedback.map((check, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                      check.status === 'pass'
                        ? 'border-emerald-200 bg-emerald-50/30'
                        : check.status === 'warn'
                        ? 'border-amber-200 bg-amber-50/30'
                        : 'border-red-200 bg-red-50/30'
                    }`}
                  >
                    {check.status === 'pass' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : check.status === 'warn' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold text-slate-900 block">{check.section}</span>
                      <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                        {check.feedback}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Grounded Bullet Improvements with One-Click Apply */}
          {analysisResult.bulletImprovements.length > 0 && (
            <Card className="shadow-2xs border-indigo-100">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <CardTitle className="text-base">
                    Grounded Bullet Point Improvement Suggestions
                  </CardTitle>
                </div>
                <CardDescription>
                  Rewritten strictly using your real responsibilities with strong action verbs and Google X-Y-Z quantifiable structures.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {analysisResult.bulletImprovements.map((bullet, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Original */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Original Text
                        </span>
                        <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-mono text-[11px]">
                          "{bullet.original}"
                        </p>
                      </div>

                      {/* Suggested */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Enhanced High-Impact Action Formula
                        </span>
                        <p className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100 text-indigo-950 font-medium text-[11px] leading-relaxed">
                          "{bullet.suggested}"
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-500 italic">
                        <strong>Rationale:</strong> {bullet.rationale}
                      </span>

                      {analysisMode === 'builder' && (
                        <Button
                          size="sm"
                          variant={bullet.applied ? 'outline' : 'primary'}
                          disabled={bullet.applied}
                          isLoading={applyingBulletIndex === idx}
                          onClick={() => handleApplyBullet(bullet, idx)}
                          leftIcon={bullet.applied ? <Check className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                        >
                          {bullet.applied ? 'Applied to Resume' : 'Apply to Resume Builder'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Actionable Recommendations Summary */}
          {analysisResult.actionableRecommendations.length > 0 && (
            <Card className="shadow-2xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Actionable Optimization Steps</CardTitle>
                <CardDescription>
                  Prioritized checklist to maximize ATS pass rate before submitting applications.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2 text-xs text-slate-700">
                  {analysisResult.actionableRecommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-3 border-t border-slate-100 flex justify-between">
                <span className="text-xs text-slate-500">
                  Audited at {new Date(analysisResult.createdAt).toLocaleTimeString()}
                </span>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => navigate('/resume-builder')}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Edit in Resume Builder
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
