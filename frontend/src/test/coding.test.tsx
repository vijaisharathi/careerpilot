import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { codingService } from '../services/coding.service';
import { apiClient } from '../services/api.client';
import { CodeEditor } from '../components/coding/CodeEditor';

describe('Phase 15: Coding Assessment & Technical Skill Evaluation Frontend Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('codingService API Client', () => {
    it('fetches questions with search and category filters', async () => {
      const mockQuestions = {
        questions: [
          {
            id: 'q1',
            slug: 'two-sum',
            title: 'Two Sum',
            difficulty: 'easy',
            category: 'algorithms',
            tags: ['hash-map', 'array'],
            acceptanceRate: 75,
            totalSubmissions: 120,
            hasStarterCode: { python: true, javascript: true },
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          totalCount: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };

      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockQuestions);

      const result = await codingService.getQuestions({
        category: 'algorithms',
        difficulty: 'easy',
        search: 'Two Sum',
      });

      expect(getSpy).toHaveBeenCalledWith(
        '/coding/questions?category=algorithms&difficulty=easy&search=Two+Sum'
      );
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].title).toBe('Two Sum');
    });

    it('fetches single question details without exposing private test cases', async () => {
      const mockDetail = {
        id: 'q1',
        slug: 'two-sum',
        title: 'Two Sum',
        description: 'Given an array of integers...',
        difficulty: 'easy',
        category: 'algorithms',
        tags: ['array'],
        starterCode: {
          python: 'def twoSum(nums, target):\n    pass',
          javascript: 'function twoSum(nums, target) {}',
        },
        sampleTestCases: [
          {
            input: 'nums = [2,7,11,15], target = 9',
            expectedOutput: '[0, 1]',
            explanation: 'nums[0] + nums[1] == 9',
          },
        ],
        timeLimitMs: 2000,
        memoryLimitMb: 128,
      };

      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockDetail);

      const result = await codingService.getQuestionDetail('two-sum');
      expect(getSpy).toHaveBeenCalledWith('/coding/questions/two-sum');
      expect(result.title).toBe('Two Sum');
      expect(result.sampleTestCases).toHaveLength(1);
      // Private test cases must not be present
      expect((result as any).privateTestCases).toBeUndefined();
    });

    it('executes sample test cases via runSampleCode', async () => {
      const mockRunResult = {
        status: 'Accepted' as const,
        totalSampleCases: 1,
        passedSampleCases: 1,
        executionDurationMs: 42,
        testCaseResults: [
          {
            input: 'nums = [2,7,11,15], target = 9',
            expectedOutput: '[0, 1]',
            actualOutput: '[0, 1]',
            status: 'Accepted',
            isPassed: true,
            executionTimeMs: 42,
          },
        ],
      };

      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(mockRunResult);

      const result = await codingService.runSampleCode({
        questionId: 'q1',
        language: 'python',
        sourceCode: 'def twoSum(nums, target): return [0, 1]',
      });

      expect(postSpy).toHaveBeenCalledWith('/coding/run-sample', {
        questionId: 'q1',
        language: 'python',
        sourceCode: 'def twoSum(nums, target): return [0, 1]',
      });
      expect(result.passedSampleCases).toBe(1);
      expect(result.testCaseResults[0].status).toBe('Accepted');
    });

    it('submits solution and receives deterministic score & sanitized results', async () => {
      const mockSubmission = {
        _id: 'sub-1',
        studentId: 'student-1',
        questionId: 'q1',
        language: 'python' as const,
        sourceCode: 'def twoSum(nums, target): return [0, 1]',
        status: 'Accepted' as const,
        scoreAwarded: 100,
        maxScore: 100,
        passedTestCasesCount: 3,
        totalTestCasesCount: 3,
        executionDurationMs: 50,
        createdAt: new Date().toISOString(),
        testCaseResults: [
          {
            testCaseIndex: 0,
            status: 'Accepted',
            isPublic: true,
            isPassed: true,
            executionTimeMs: 45,
          },
          {
            testCaseIndex: 1,
            status: 'Accepted',
            isPublic: false,
            isPassed: true,
            executionTimeMs: 50,
          },
        ],
      };

      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(mockSubmission);

      const result = await codingService.submitSolution({
        questionId: 'q1',
        language: 'python',
        sourceCode: 'def twoSum(nums, target): return [0, 1]',
      });

      expect(postSpy).toHaveBeenCalledWith('/coding/submit', expect.any(Object));
      expect(result.status).toBe('Accepted');
      expect(result.scoreAwarded).toBe(100);
      // Private test case output must remain hidden
      expect(result.testCaseResults[1].actualOutput).toBeUndefined();
    });

    it('requests pedagogical AI feedback without affecting scoring', async () => {
      const mockFeedback = {
        aiFeedback: {
          codeQualityScore: 88,
          algorithmicComplexity: 'Time: O(N), Space: O(N)',
          mistakeAnalysis: 'No major bugs found.',
          edgeCasesIdentified: ['Empty array', 'Negative target values'],
          suggestions: ['Use dict get method for cleaner lookup.'],
          optimizedApproachHint: 'Hash map provides linear single pass.',
        },
      };

      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(mockFeedback);

      const result = await codingService.requestAiFeedback('sub-1');
      expect(postSpy).toHaveBeenCalledWith('/coding/submissions/sub-1/ai-feedback', {});
      expect(result.aiFeedback.codeQualityScore).toBe(88);
      expect(result.aiFeedback.edgeCasesIdentified).toContain('Empty array');
    });

    it('fetches candidate technical summary for placement officers', async () => {
      const mockSummary = {
        overallCodingScore: 92,
        totalProblemsSolved: 14,
        totalSubmissions: 28,
        categoryProficiencies: [
          { category: 'algorithms', problemsSolved: 8, totalAttempted: 10, accuracyPercentage: 80 },
        ],
        languageProficiencies: [{ language: 'python', problemsSolved: 14 }],
      };

      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockSummary);

      const result = await codingService.getCandidateTechnicalSummary('student-123');
      expect(getSpy).toHaveBeenCalledWith('/coding/placement/candidates/student-123/summary');
      expect(result.overallCodingScore).toBe(92);
      expect(result.totalProblemsSolved).toBe(14);
    });

    it('fetches institutional coding analytics for placement officers', async () => {
      const mockAnalytics = {
        totalStudentsEvaluated: 45,
        averageCodingScore: 78,
        categoryPerformance: [
          { category: 'data-structures', averageAccuracy: 82, totalAttempts: 120 },
        ],
        commonSkillGaps: ['dynamic-programming'],
        topPerformers: [
          { studentId: 's1', studentName: 'Alice', overallCodingScore: 98, totalSolved: 25 },
        ],
      };

      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockAnalytics);

      const result = await codingService.getPlacementCodingAnalytics();
      expect(getSpy).toHaveBeenCalledWith('/coding/placement/analytics');
      expect(result.totalStudentsEvaluated).toBe(45);
      expect(result.averageCodingScore).toBe(78);
    });
  });

  describe('CodeEditor Component', () => {
    it('renders code editor with language selector and initial code', () => {
      const handleChange = vi.fn();
      const handleLangChange = vi.fn();

      render(
        <CodeEditor
          language="python"
          code="print('Hello world')"
          onChange={handleChange}
          onLanguageChange={handleLangChange}
        />
      );

      expect(screen.getByDisplayValue("print('Hello world')")).toBeInTheDocument();
      expect(screen.getByText('Python 3.10')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Line number 1
    });

    it('allows changing language via dropdown', () => {
      const handleChange = vi.fn();
      const handleLangChange = vi.fn();

      render(
        <CodeEditor
          language="python"
          code="def solution(): pass"
          onChange={handleChange}
          onLanguageChange={handleLangChange}
        />
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'javascript' } });
      expect(handleLangChange).toHaveBeenCalledWith('javascript');
    });

    it('supports user typing and editing code', () => {
      const handleChange = vi.fn();

      render(
        <CodeEditor
          language="python"
          code="def solve():"
          onChange={handleChange}
        />
      );

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'def solve(): return 42' } });
      expect(handleChange).toHaveBeenCalledWith('def solve(): return 42');
    });

    it('renders reset button when starter code is provided', () => {
      const handleChange = vi.fn();
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(
        <CodeEditor
          language="python"
          code="modified code"
          starterCode="initial starter code"
          onChange={handleChange}
        />
      );

      const resetButton = screen.getByTitle('Reset to starter code');
      expect(resetButton).toBeInTheDocument();
      fireEvent.click(resetButton);
      expect(handleChange).toHaveBeenCalledWith('initial starter code');
    });
  });
});

