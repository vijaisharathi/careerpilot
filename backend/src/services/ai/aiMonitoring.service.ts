export interface AiRequestLogEntry {
  timestamp: Date;
  provider: string;
  model: string;
  durationMs: number;
  success: boolean;
  tokensEstimated?: number;
  errorSummary?: string;
}

export interface AiMonitoringStats {
  provider: string;
  model: string;
  isConfigured: boolean;
  isSimulated: boolean;
  status: 'operational' | 'degraded' | 'failing';
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRatePercentage: number;
  averageLatencyMs: number;
  totalTokensEstimated: number;
  consecutiveFailures: number;
  recentRequests: AiRequestLogEntry[];
}

export class AiMonitoringService {
  private totalRequests = 0;
  private successfulRequests = 0;
  private failedRequests = 0;
  private totalDurationMs = 0;
  private totalTokensEstimated = 0;
  private consecutiveFailures = 0;
  private recentRequests: AiRequestLogEntry[] = [];
  private readonly maxLogHistory = 25;

  /**
   * Records performance and outcome of an AI request
   */
  public recordRequest(entry: {
    provider: string;
    model: string;
    durationMs: number;
    success: boolean;
    tokens?: number;
    error?: string;
  }): void {
    this.totalRequests++;
    this.totalDurationMs += entry.durationMs;

    if (entry.success) {
      this.successfulRequests++;
      this.consecutiveFailures = 0;
    } else {
      this.failedRequests++;
      this.consecutiveFailures++;
    }

    if (entry.tokens) {
      this.totalTokensEstimated += entry.tokens;
    }

    // Safe error message summary without prompt leakage
    const errorSummary = entry.error
      ? entry.error.replace(/[a-zA-Z0-9_-]{20,}/g, '[REDACTED_KEY]').slice(0, 150)
      : undefined;

    const logEntry: AiRequestLogEntry = {
      timestamp: new Date(),
      provider: entry.provider,
      model: entry.model,
      durationMs: Math.round(entry.durationMs),
      success: entry.success,
      tokensEstimated: entry.tokens,
      errorSummary,
    };

    this.recentRequests.unshift(logEntry);
    if (this.recentRequests.length > this.maxLogHistory) {
      this.recentRequests = this.recentRequests.slice(0, this.maxLogHistory);
    }
  }

  /**
   * Retrieves aggregated AI monitoring metrics for administrative review
   */
  public getStats(isConfigured: boolean, isSimulated: boolean, activeProvider: string): AiMonitoringStats {
    const avgLatency =
      this.totalRequests > 0 ? Math.round(this.totalDurationMs / this.totalRequests) : 0;

    const successRate =
      this.totalRequests > 0
        ? Math.round((this.successfulRequests / this.totalRequests) * 100)
        : 100;

    let status: 'operational' | 'degraded' | 'failing' = 'operational';
    if (this.consecutiveFailures >= 5) {
      status = 'failing';
    } else if (this.consecutiveFailures >= 2) {
      status = 'degraded';
    }

    const defaultModel =
      activeProvider === 'gemini'
        ? 'gemini-1.5-flash'
        : activeProvider === 'openai'
        ? 'gpt-4o-mini'
        : 'deterministic-rubric-engine';

    return {
      provider: activeProvider,
      model: defaultModel,
      isConfigured,
      isSimulated,
      status,
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      successRatePercentage: successRate,
      averageLatencyMs: avgLatency,
      totalTokensEstimated: this.totalTokensEstimated,
      consecutiveFailures: this.consecutiveFailures,
      recentRequests: this.recentRequests,
    };
  }

  /**
   * Resets metrics (useful for testing)
   */
  public resetMetrics(): void {
    this.totalRequests = 0;
    this.successfulRequests = 0;
    this.failedRequests = 0;
    this.totalDurationMs = 0;
    this.totalTokensEstimated = 0;
    this.consecutiveFailures = 0;
    this.recentRequests = [];
  }
}

export const aiMonitoringService = new AiMonitoringService();

