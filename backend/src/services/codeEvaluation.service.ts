import { Types } from 'mongoose';
import {
  CodeSubmission,
  ICodeSubmission,
  ISubmissionTestCaseResult,
  SubmissionStatus,
} from '../models/codeSubmission.model';
import { CodingQuestion, SupportedLanguage } from '../models/codingQuestion.model';
import { CodingAssessment } from '../models/codingAssessment.model';
import { AssessmentAttempt } from '../models/assessmentAttempt.model';
import { StudentSkillAssessmentSummary } from '../models/studentSkillAssessmentSummary.model';
import { codeExecutionService, CodeExecutionResponse } from './codeExecution.service';
import { llmService } from './ai/llm.service';

export interface RunSampleResponse {
  status: SubmissionStatus;
  totalSampleCases: number;
  passedSampleCases: number;
  testCaseResults: Array<{
    input: string;
    expectedOutput: string;
    actualOutput?: string;
    status: string;
    isPassed: boolean;
    executionTimeMs: number;
    errorDetails?: string;
  }>;
  compilationError?: string;
  runtimeError?: string;
  executionDurationMs: number;
}

export class CodeEvaluationService {
  /**
   * Runs code against public sample test cases (for "Run Code" button).
   */
  public async runCodeSample(
    studentId: string,
    questionId: string,
    language: SupportedLanguage,
    sourceCode: string
  ): Promise<RunSampleResponse> {
    const question = await CodingQuestion.findById(questionId);
    if (!question || question.status === 'archived') {
      throw new Error('Coding question not found or is inactive.');
    }

    if (!question.sampleTestCases || question.sampleTestCases.length === 0) {
      throw new Error('This problem has no public sample test cases configured.');
    }

    const testCaseResults: RunSampleResponse['testCaseResults'] = [];
    let passedCount = 0;
    let totalDurationMs = 0;
    let overallStatus: SubmissionStatus = 'accepted';
    let compilationError: string | undefined;
    let runtimeError: string | undefined;

    for (const testCase of question.sampleTestCases) {
      const execResult: CodeExecutionResponse = await codeExecutionService.execute({
        language,
        sourceCode,
        stdin: testCase.input,
        expectedOutput: testCase.output,
        timeLimitMs: question.timeLimitMs,
        memoryLimitMb: question.memoryLimitMb,
      });

      totalDurationMs += execResult.executionTimeMs;

      if (execResult.status === 'compilation_error') {
        overallStatus = 'compilation_error';
        compilationError = execResult.compileOutput || execResult.stderr || 'Compilation failed';
        testCaseResults.push({
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: '',
          status: 'compilation_error',
          isPassed: false,
          executionTimeMs: execResult.executionTimeMs,
          errorDetails: compilationError,
        });
        break; // Stop execution on compilation failure
      }

      if (execResult.status === 'runtime_error') {
        runtimeError = execResult.stderr || 'Runtime error encountered';
        if (overallStatus === 'accepted') overallStatus = 'runtime_error';
      } else if (execResult.status === 'time_limit_exceeded') {
        if (overallStatus === 'accepted') overallStatus = 'time_limit_exceeded';
      } else if (execResult.status === 'wrong_answer') {
        if (overallStatus === 'accepted') overallStatus = 'wrong_answer';
      }

      const isPassed = execResult.status === 'accepted';
      if (isPassed) passedCount++;

      testCaseResults.push({
        input: testCase.input,
        expectedOutput: testCase.output,
        actualOutput: execResult.stdout || '',
        status: execResult.status,
        isPassed,
        executionTimeMs: execResult.executionTimeMs,
        errorDetails: execResult.stderr || execResult.errorDetails,
      });
    }

    return {
      status: overallStatus,
      totalSampleCases: question.sampleTestCases.length,
      passedSampleCases: passedCount,
      testCaseResults,
      compilationError,
      runtimeError,
      executionDurationMs: totalDurationMs,
    };
  }

  /**
   * Submits a full solution evaluated against all public and private test cases.
   * Strips all private test inputs and outputs before returning to the student!
   */
  public async submitSolution(params: {
    studentId: string;
    questionId: string;
    language: SupportedLanguage;
    sourceCode: string;
    assessmentId?: string;
    attemptId?: string;
  }): Promise<ICodeSubmission> {
    const { studentId, questionId, language, sourceCode, assessmentId, attemptId } = params;

    const question = await CodingQuestion.findById(questionId);
    if (!question || question.status === 'archived') {
      throw new Error('Question not found or is inactive.');
    }

    // Verify active assessment attempt if attemptId is provided
    let attempt: any = null;
    let maxMarks = 10;
    if (attemptId) {
      attempt = await AssessmentAttempt.findById(attemptId);
      if (!attempt) {
        throw new Error('Assessment session not found.');
      }
      if (attempt.studentId.toString() !== studentId) {
        throw new Error('Unauthorized attempt session.');
      }
      if (attempt.status !== 'in_progress') {
        throw new Error(`Cannot submit: This attempt is already marked as ${attempt.status}.`);
      }
      if (new Date() > attempt.expiresAt) {
        attempt.status = 'timed_out';
        await attempt.save();
        throw new Error('Assessment deadline has expired. This session is now timed out.');
      }

      const assessment = await CodingAssessment.findById(attempt.assessmentId);
      const questionConfig = assessment?.questions.find(
        (q) => q.questionId.toString() === questionId
      );
      if (questionConfig) {
        maxMarks = questionConfig.marks;
      }
    }

    // Compile evaluation test suite (sample + private test cases)
    interface EvaluationCase {
      input: string;
      output: string;
      isPublic: boolean;
    }

    const testSuite: EvaluationCase[] = [
      ...question.sampleTestCases.map((st) => ({
        input: st.input,
        output: st.output,
        isPublic: true,
      })),
      ...question.privateTestCases.map((pt) => ({
        input: pt.input,
        output: pt.output,
        isPublic: false,
      })),
    ];

    const results: ISubmissionTestCaseResult[] = [];
    let passedCount = 0;
    let totalDurationMs = 0;
    let overallStatus: SubmissionStatus = 'accepted';
    let compilationError: string | undefined;
    let runtimeError: string | undefined;

    for (let i = 0; i < testSuite.length; i++) {
      const tc = testSuite[i];
      const execResult = await codeExecutionService.execute({
        language,
        sourceCode,
        stdin: tc.input,
        expectedOutput: tc.output,
        timeLimitMs: question.timeLimitMs,
        memoryLimitMb: question.memoryLimitMb,
      });

      totalDurationMs += execResult.executionTimeMs;

      if (execResult.status === 'compilation_error') {
        overallStatus = 'compilation_error';
        compilationError = execResult.compileOutput || execResult.stderr || 'Compilation failed';
        results.push({
          testCaseIndex: i + 1,
          isPassed: false,
          status: 'compilation_error',
          isPublic: tc.isPublic,
          executionTimeMs: execResult.executionTimeMs,
          errorMessage: compilationError,
          actualOutput: tc.isPublic ? execResult.stdout : undefined, // Never expose private outputs!
        });
        break;
      }

      const isPassed = execResult.status === 'accepted';
      if (isPassed) {
        passedCount++;
      } else {
        if (overallStatus === 'accepted') {
          overallStatus = execResult.status;
        }
        if (execResult.status === 'runtime_error') {
          runtimeError = execResult.stderr || 'Runtime error encountered';
        }
      }

      results.push({
        testCaseIndex: i + 1,
        isPassed,
        status: execResult.status,
        isPublic: tc.isPublic,
        executionTimeMs: execResult.executionTimeMs,
        memoryUsedKb: execResult.memoryUsedKb,
        errorMessage: tc.isPublic ? execResult.stderr : undefined,
        actualOutput: tc.isPublic ? execResult.stdout : undefined, // Strictly omitted for private test cases
      });
    }

    // Deterministic score calculation
    const scoreAwarded =
      testSuite.length > 0 ? Math.round((passedCount / testSuite.length) * maxMarks) : 0;

    const submission = new CodeSubmission({
      studentId: new Types.ObjectId(studentId),
      questionId: new Types.ObjectId(questionId),
      assessmentId: assessmentId ? new Types.ObjectId(assessmentId) : undefined,
      attemptId: attemptId ? new Types.ObjectId(attemptId) : undefined,
      language,
      sourceCode,
      status: overallStatus,
      passedTestCasesCount: passedCount,
      totalTestCasesCount: testSuite.length,
      testCaseResults: results,
      scoreAwarded,
      maxScore: maxMarks,
      executionDurationMs: totalDurationMs,
      compilationError,
      runtimeError,
    });

    await submission.save();

    // If part of an assessment attempt, update questionSubmissions and attempt score
    if (attempt) {
      const existingRefIndex = attempt.questionSubmissions.findIndex(
        (qs: any) => qs.questionId.toString() === questionId
      );

      if (existingRefIndex >= 0) {
        const prevMarks = attempt.questionSubmissions[existingRefIndex].marksAwarded || 0;
        // Keep highest score on multiple submissions for same question in attempt
        if (scoreAwarded > prevMarks || !attempt.questionSubmissions[existingRefIndex].submissionId) {
          attempt.questionSubmissions[existingRefIndex].submissionId = submission._id;
          attempt.questionSubmissions[existingRefIndex].marksAwarded = scoreAwarded;
        }
      } else {
        attempt.questionSubmissions.push({
          questionId: new Types.ObjectId(questionId),
          submissionId: submission._id,
          marksAwarded: scoreAwarded,
        });
      }

      // Recalculate total attempt score
      attempt.totalScore = attempt.questionSubmissions.reduce(
        (sum: number, qs: any) => sum + (qs.marksAwarded || 0),
        0
      );
      await attempt.save();
    }

    // Update student technical skill profile in background
    this.updateStudentTechnicalSkillProfile(studentId, question.category, language, overallStatus === 'accepted').catch(
      (err) => console.error('Failed to update technical skill profile:', err)
    );

    return submission;
  }

  /**
   * Generates educational AI feedback for a student's submission.
   */
  public async requestAiFeedback(studentId: string, submissionId: string): Promise<any> {
    const submission = await CodeSubmission.findById(submissionId).populate(
      'questionId',
      'title description constraints hints difficulty category'
    );

    if (!submission) {
      throw new Error('Submission record not found.');
    }

    if (submission.studentId.toString() !== studentId) {
      throw new Error('Unauthorized: You can only request feedback on your own submissions.');
    }

    const question: any = submission.questionId;
    const prompt = `You are a patient, senior computer science instructor. Analyze the student's coding submission for the problem "${question.title}" (${question.difficulty} difficulty).
Problem: ${question.description}
Language: ${submission.language}
Student Code:
\`\`\`${submission.language}
${submission.sourceCode}
\`\`\`
Evaluation Status: ${submission.status}
Passed Test Cases: ${submission.passedTestCasesCount} of ${submission.totalTestCasesCount}
Compilation Error (if any): ${submission.compilationError || 'None'}
Runtime Error (if any): ${submission.runtimeError || 'None'}

Provide educational guidance in structured JSON:
{
  "explanation": "Clear explanation of how the code currently behaves and where the logic succeeds or fails.",
  "mistakeAnalysis": "Constructive analysis of edge cases, off-by-one errors, or algorithmic flaws.",
  "optimizationSuggestion": "Big-O time and space complexity notes and architectural improvements without giving away the full code.",
  "hints": ["Hint 1 to nudge the student in the right direction", "Hint 2 for optimal approach"]
}`;

    try {
      const response = await llmService.generateCompletion(prompt, {
        systemInstruction:
          'You are an expert coding tutor. Be constructive, encouraging, and pedagogically sound. Return valid JSON only.',
      });

      let parsed: any;
      try {
        const cleaned = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = {
          explanation: response.text,
          mistakeAnalysis: 'Review test case edge conditions and variable boundaries.',
          optimizationSuggestion: 'Ensure optimal time and space complexity.',
          hints: question.hints || [],
        };
      }

      submission.aiFeedback = {
        ...parsed,
        generatedAt: new Date(),
      };
      await submission.save();
      return submission.aiFeedback;
    } catch {
      // Graceful fallback when AI provider is unavailable
      const fallback = {
        explanation: `Your submission completed with status: ${submission.status.toUpperCase()} (${submission.passedTestCasesCount}/${submission.totalTestCasesCount} test cases passed).`,
        mistakeAnalysis:
          submission.status === 'accepted'
            ? 'Solution is logically sound across all evaluation test cases.'
            : 'Check boundary conditions, zero inputs, and corner case logic.',
        optimizationSuggestion: 'Analyze asymptotic time complexity and auxiliary space usage.',
        hints: question.hints || ['Break the problem into sub-problems and trace with pen and paper.'],
        generatedAt: new Date(),
      };
      submission.aiFeedback = fallback;
      await submission.save();
      return fallback;
    }
  }

  /**
   * Recomputes and updates the student's technical skill profile.
   */
  public async updateStudentTechnicalSkillProfile(
    studentId: string,
    categoryName: string,
    language: string,
    isAccepted: boolean
  ): Promise<void> {
    let summary = await StudentSkillAssessmentSummary.findOne({
      studentId: new Types.ObjectId(studentId),
    });

    if (!summary) {
      summary = new StudentSkillAssessmentSummary({
        studentId: new Types.ObjectId(studentId),
        overallCodingScore: 0,
        totalProblemsSolved: 0,
        totalSubmissions: 0,
        categoryProficiencies: [],
        languageProficiencies: [],
        strengths: [],
        areasForImprovement: [],
        recommendedTopics: [],
      });
    }

    summary.totalSubmissions += 1;
    if (isAccepted) {
      summary.totalProblemsSolved += 1;
    }

    // Update category proficiency
    const catIdx = summary.categoryProficiencies.findIndex((c) => c.category === categoryName);
    if (catIdx >= 0) {
      summary.categoryProficiencies[catIdx].totalAttempted += 1;
      if (isAccepted) {
        summary.categoryProficiencies[catIdx].problemsSolved += 1;
      }
      const acc = Math.round(
        (summary.categoryProficiencies[catIdx].problemsSolved /
          summary.categoryProficiencies[catIdx].totalAttempted) *
          100
      );
      summary.categoryProficiencies[catIdx].accuracyPercentage = acc;
      summary.categoryProficiencies[catIdx].proficiencyLevel =
        acc >= 75 && summary.categoryProficiencies[catIdx].problemsSolved >= 3
          ? 'Advanced'
          : acc >= 50
          ? 'Intermediate'
          : 'Beginner';
    } else {
      summary.categoryProficiencies.push({
        category: categoryName,
        problemsSolved: isAccepted ? 1 : 0,
        totalAttempted: 1,
        accuracyPercentage: isAccepted ? 100 : 0,
        proficiencyLevel: 'Beginner',
      });
    }

    // Update language proficiency
    const langIdx = summary.languageProficiencies.findIndex((l) => l.language === language);
    if (langIdx >= 0) {
      if (isAccepted) {
        summary.languageProficiencies[langIdx].problemsSolved += 1;
      }
      summary.languageProficiencies[langIdx].lastUsed = new Date();
    } else {
      summary.languageProficiencies.push({
        language,
        problemsSolved: isAccepted ? 1 : 0,
        lastUsed: new Date(),
      });
    }

    // Recompute overall coding score (weighted on solved count and accuracy)
    const totalAttempted = summary.categoryProficiencies.reduce((sum, c) => sum + c.totalAttempted, 0);
    const totalSolved = summary.categoryProficiencies.reduce((sum, c) => sum + c.problemsSolved, 0);
    const avgAccuracy = totalAttempted > 0 ? (totalSolved / totalAttempted) * 100 : 0;
    summary.overallCodingScore = Math.min(100, Math.round(totalSolved * 10 + avgAccuracy * 0.5));

    // Derive strengths and weaknesses
    summary.strengths = summary.categoryProficiencies
      .filter((c) => c.accuracyPercentage >= 70 && c.problemsSolved >= 1)
      .map((c) => c.category);

    summary.areasForImprovement = summary.categoryProficiencies
      .filter((c) => c.accuracyPercentage < 50 || c.problemsSolved === 0)
      .map((c) => c.category);

    summary.lastEvaluatedAt = new Date();
    await summary.save();
  }

  /**
   * Retrieves personal submission history for student.
   */
  public async getStudentSubmissions(
    studentId: string,
    query?: { questionId?: string; page?: number; limit?: number }
  ): Promise<{ submissions: ICodeSubmission[]; totalCount: number }> {
    const filter: Record<string, any> = { studentId: new Types.ObjectId(studentId) };
    if (query?.questionId) {
      filter.questionId = new Types.ObjectId(query.questionId);
    }

    const page = Math.max(1, query?.page || 1);
    const limit = Math.min(50, Math.max(1, query?.limit || 10));
    const skip = (page - 1) * limit;

    const [submissions, totalCount] = await Promise.all([
      CodeSubmission.find(filter)
        .populate('questionId', 'title slug difficulty category')
        .populate('assessmentId', 'title slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      CodeSubmission.countDocuments(filter),
    ]);

    return { submissions, totalCount };
  }

  /**
   * Retrieves single submission detail with strict ownership verification.
   */
  public async getSubmissionDetail(submissionId: string, studentId: string): Promise<ICodeSubmission> {
    const submission = await CodeSubmission.findById(submissionId)
      .populate('questionId', 'title slug difficulty category constraints')
      .populate('assessmentId', 'title slug');

    if (!submission) {
      throw new Error('Submission not found.');
    }

    if (submission.studentId.toString() !== studentId) {
      throw new Error('Unauthorized: You cannot access another candidate’s submission.');
    }

    return submission;
  }
}

export const codeEvaluationService = new CodeEvaluationService();
