import { env } from '../config/env';
import { SupportedLanguage } from '../models/codingQuestion.model';
import { SubmissionStatus } from '../models/codeSubmission.model';

export interface CodeExecutionRequest {
  language: SupportedLanguage;
  sourceCode: string;
  stdin?: string;
  expectedOutput?: string;
  timeLimitMs?: number;
  memoryLimitMb?: number;
}

export interface CodeExecutionResponse {
  status: SubmissionStatus;
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  executionTimeMs: number;
  memoryUsedKb?: number;
  errorDetails?: string;
  exitCode?: number;
  isConfigurationRequired?: boolean;
}

export interface SandboxStatusInfo {
  provider: 'judge0' | 'piston' | 'mock';
  isConfigured: boolean;
  supportedLanguages: SupportedLanguage[];
  details: string;
}

// Judge0 language ID mappings (Standard CE)
const JUDGE0_LANGUAGE_IDS: Record<SupportedLanguage, number> = {
  python: 71, // Python (3.8.1)
  javascript: 63, // JavaScript (Node.js 12.14.0)
  java: 62, // Java (OpenJDK 13.0.1)
  cpp: 54, // C++ (GCC 9.2.0)
};

export class CodeExecutionService {
  private provider: 'judge0' | 'piston' | 'mock';
  private judge0Url: string;
  private judge0Key: string;
  private pistonUrl: string;

  constructor() {
    this.provider = env.CODE_EXECUTION_PROVIDER;
    this.judge0Url = env.JUDGE0_API_URL || '';
    this.judge0Key = env.JUDGE0_API_KEY || '';
    this.pistonUrl = env.PISTON_API_URL || '';
  }

  public getStatus(): SandboxStatusInfo {
    const isConfigured =
      this.provider === 'mock' ||
      (this.provider === 'judge0' && !!this.judge0Url) ||
      (this.provider === 'piston' && !!this.pistonUrl);

    return {
      provider: this.provider,
      isConfigured,
      supportedLanguages: ['python', 'javascript', 'java', 'cpp'],
      details:
        this.provider === 'judge0'
          ? `Judge0 API sandbox connected at ${this.judge0Url || 'UNCONFIGURED'}`
          : this.provider === 'piston'
          ? `Piston isolated runner connected at ${this.pistonUrl || 'UNCONFIGURED'}`
          : 'Isolated safe mock sandbox active for testing and verification',
    };
  }

  public async execute(request: CodeExecutionRequest): Promise<CodeExecutionResponse> {
    // 1. Security Check: Code & input size constraints
    if (!request.sourceCode || request.sourceCode.length > 64 * 1024) {
      return {
        status: 'execution_failed',
        executionTimeMs: 0,
        errorDetails: 'Source code exceeds maximum permitted size limit of 64 KB.',
      };
    }

    if (request.stdin && request.stdin.length > 10 * 1024) {
      return {
        status: 'execution_failed',
        executionTimeMs: 0,
        errorDetails: 'Input data exceeds maximum permitted size limit of 10 KB.',
      };
    }

    // 2. Route according to configured provider
    if (this.provider === 'judge0') {
      return this.executeJudge0(request);
    } else if (this.provider === 'piston') {
      return this.executePiston(request);
    } else {
      return this.executeSafeMock(request);
    }
  }

  // --- Judge0 Execution Engine ---
  private async executeJudge0(request: CodeExecutionRequest): Promise<CodeExecutionResponse> {
    if (!this.judge0Url) {
      return {
        status: 'execution_failed',
        executionTimeMs: 0,
        isConfigurationRequired: true,
        errorDetails:
          'Judge0 execution provider is selected but JUDGE0_API_URL is not configured.',
      };
    }

    try {
      const languageId = JUDGE0_LANGUAGE_IDS[request.language];
      const timeLimitSeconds = Math.max(1, Math.min(10, (request.timeLimitMs || 2000) / 1000));
      const memoryLimitKb = (request.memoryLimitMb || 256) * 1024;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (this.judge0Key) {
        headers['X-Auth-Token'] = this.judge0Key;
      }

      const response = await fetch(`${this.judge0Url}/submissions?wait=true`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          source_code: request.sourceCode,
          language_id: languageId,
          stdin: request.stdin || '',
          expected_output: request.expectedOutput || '',
          cpu_time_limit: timeLimitSeconds,
          memory_limit: memoryLimitKb,
          enable_network: false, // Strict network isolation
        }),
      });

      if (!response.ok) {
        return {
          status: 'execution_failed',
          executionTimeMs: 0,
          errorDetails: `Sandbox execution service returned HTTP ${response.status}`,
        };
      }

      const data = (await response.json()) as any;
      const statusId = data.status?.id;

      // Judge0 status ids:
      // 3: Accepted, 4: Wrong Answer, 5: Time Limit Exceeded, 6: Compilation Error,
      // 7-12: Runtime Errors
      let finalStatus: SubmissionStatus = 'accepted';
      if (statusId === 3) finalStatus = 'accepted';
      else if (statusId === 4) finalStatus = 'wrong_answer';
      else if (statusId === 5) finalStatus = 'time_limit_exceeded';
      else if (statusId === 6) finalStatus = 'compilation_error';
      else if (statusId >= 7 && statusId <= 12) finalStatus = 'runtime_error';
      else finalStatus = 'execution_failed';

      return {
        status: finalStatus,
        stdout: data.stdout || '',
        stderr: data.stderr || '',
        compileOutput: data.compile_output || '',
        executionTimeMs: Math.round((parseFloat(data.time) || 0) * 1000),
        memoryUsedKb: data.memory || 0,
        exitCode: data.exit_code,
      };
    } catch (err) {
      return {
        status: 'execution_failed',
        executionTimeMs: 0,
        errorDetails: `Judge0 execution network failure: ${(err as Error).message}`,
      };
    }
  }

  // --- Piston Execution Engine ---
  private async executePiston(request: CodeExecutionRequest): Promise<CodeExecutionResponse> {
    if (!this.pistonUrl) {
      return {
        status: 'execution_failed',
        executionTimeMs: 0,
        isConfigurationRequired: true,
        errorDetails:
          'Piston execution provider is selected but PISTON_API_URL is not configured.',
      };
    }

    try {
      const pistonLanguage = request.language === 'cpp' ? 'c++' : request.language;
      const response = await fetch(`${this.pistonUrl}/api/v2/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: pistonLanguage,
          version: '*',
          files: [{ content: request.sourceCode }],
          stdin: request.stdin || '',
          run_timeout: Math.min(10000, request.timeLimitMs || 2000),
        }),
      });

      if (!response.ok) {
        return {
          status: 'execution_failed',
          executionTimeMs: 0,
          errorDetails: `Piston execution service returned HTTP ${response.status}`,
        };
      }

      const data = (await response.json()) as any;
      const run = data.run || {};
      const compile = data.compile;

      if (compile && compile.code !== 0) {
        return {
          status: 'compilation_error',
          compileOutput: compile.output || compile.stderr,
          executionTimeMs: 0,
        };
      }

      if (run.code !== 0) {
        return {
          status: 'runtime_error',
          stderr: run.output || run.stderr,
          executionTimeMs: 0,
        };
      }

      const stdout = run.output || run.stdout || '';
      const isAccepted = request.expectedOutput
        ? this.compareOutputs(stdout, request.expectedOutput)
        : true;

      return {
        status: isAccepted ? 'accepted' : 'wrong_answer',
        stdout,
        executionTimeMs: 45,
      };
    } catch (err) {
      return {
        status: 'execution_failed',
        executionTimeMs: 0,
        errorDetails: `Piston execution network failure: ${(err as Error).message}`,
      };
    }
  }

  // --- Safe Isolated Mock Execution Engine (Test & Dev Safe Fallback) ---
  // Note: Runs zero child processes on host, strictly protecting application host integrity.
  private async executeSafeMock(request: CodeExecutionRequest): Promise<CodeExecutionResponse> {
    const code = request.sourceCode;
    const stdin = request.stdin || '';
    const expected = request.expectedOutput || '';

    // Check for simulated compilation/syntax errors
    if (
      code.includes('SYNTAX_ERROR') ||
      code.includes('syntax error') ||
      code.includes('import missing_module_error')
    ) {
      return {
        status: 'compilation_error',
        compileOutput: 'SyntaxError: invalid syntax on line 1',
        executionTimeMs: 12,
        exitCode: 1,
      };
    }

    // Check for simulated runtime errors
    if (
      code.includes('throw new Error') ||
      code.includes('raise Exception') ||
      code.includes('RUNTIME_ERROR') ||
      code.includes('ZeroDivisionError')
    ) {
      return {
        status: 'runtime_error',
        stderr: 'ZeroDivisionError: division by zero or unhandled exception',
        executionTimeMs: 25,
        exitCode: 1,
      };
    }

    // Check for simulated time limit exceeded
    if (code.includes('TIME_LIMIT_EXCEEDED') || code.includes('while True:') || code.includes('while(true)')) {
      return {
        status: 'time_limit_exceeded',
        errorDetails: `Execution timed out after ${request.timeLimitMs || 2000} ms`,
        executionTimeMs: request.timeLimitMs || 2000,
      };
    }

    // Check for simulated memory limit exceeded
    if (code.includes('MEMORY_LIMIT_EXCEEDED')) {
      return {
        status: 'memory_limit_exceeded',
        errorDetails: 'Memory limit exceeded (maximum 256 MB)',
        executionTimeMs: 110,
      };
    }

    // Check for deliberate wrong answer
    if (code.includes('WRONG_ANSWER') || code.includes('return -1') || code.includes('console.log("wrong")')) {
      return {
        status: 'wrong_answer',
        stdout: 'incorrect_output',
        executionTimeMs: 30,
      };
    }

    // Default to clean expected execution simulation
    const simulatedOutput = expected || stdin || '0';
    return {
      status: 'accepted',
      stdout: simulatedOutput,
      executionTimeMs: 42,
      memoryUsedKb: 14200,
      exitCode: 0,
    };
  }

  public compareOutputs(actual: string, expected: string): boolean {
    const normalize = (str: string) =>
      str
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map((line) => line.trimEnd())
        .join('\n')
        .trim();

    return normalize(actual) === normalize(expected);
  }
}

export const codeExecutionService = new CodeExecutionService();
