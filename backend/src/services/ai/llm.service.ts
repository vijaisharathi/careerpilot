import { env } from '../../config/env';
import { ILlmProvider, LlmCompletionOptions, LlmCompletionResponse, LlmMessage } from './llm.interface';
import { MockLlmProvider } from './providers/mock.provider';
import { GeminiLlmProvider } from './providers/gemini.provider';
import { OpenAiLlmProvider } from './providers/openai.provider';
import { aiMonitoringService, AiMonitoringStats } from './aiMonitoring.service';
import { logger } from '../../utils/logger';

export interface AiServiceStatus {
  activeProvider: string;
  isConfigured: boolean;
  isSimulated: boolean;
  supportedProviders: string[];
}

export class LlmService {
  private provider: ILlmProvider;

  constructor() {
    this.provider = this.createProvider(env.AI_PROVIDER);
    logger.info(`[LlmService] Initialized with provider: ${this.provider.name} (Configured: ${this.provider.isConfigured()})`);
  }

  private createProvider(providerName: string): ILlmProvider {
    switch (providerName.toLowerCase()) {
      case 'gemini':
        return new GeminiLlmProvider();
      case 'openai':
        return new OpenAiLlmProvider();
      case 'mock':
      default:
        return new MockLlmProvider();
    }
  }

  public getStatus(): AiServiceStatus {
    return {
      activeProvider: this.provider.name,
      isConfigured: this.provider.isConfigured(),
      isSimulated: this.provider.name === 'mock',
      supportedProviders: ['mock', 'gemini', 'openai'],
    };
  }

  public getMonitoringStats(): AiMonitoringStats {
    const status = this.getStatus();
    return aiMonitoringService.getStats(status.isConfigured, status.isSimulated, status.activeProvider);
  }

  public async generateCompletion(
    prompt: string,
    options?: LlmCompletionOptions
  ): Promise<LlmCompletionResponse> {
    const start = Date.now();
    try {
      const res = await this.provider.generateCompletion(prompt, options);
      aiMonitoringService.recordRequest({
        provider: this.provider.name,
        model: options?.model || this.provider.name,
        durationMs: Date.now() - start,
        success: true,
        tokens: res.usage?.totalTokens,
      });
      return res;
    } catch (err) {
      aiMonitoringService.recordRequest({
        provider: this.provider.name,
        model: options?.model || this.provider.name,
        durationMs: Date.now() - start,
        success: false,
        error: (err as Error).message,
      });
      throw err;
    }
  }

  public async generateChat(
    messages: LlmMessage[],
    options?: LlmCompletionOptions
  ): Promise<LlmCompletionResponse> {
    const start = Date.now();
    try {
      const res = await this.provider.generateChat(messages, options);
      aiMonitoringService.recordRequest({
        provider: this.provider.name,
        model: options?.model || this.provider.name,
        durationMs: Date.now() - start,
        success: true,
        tokens: res.usage?.totalTokens,
      });
      return res;
    } catch (err) {
      aiMonitoringService.recordRequest({
        provider: this.provider.name,
        model: options?.model || this.provider.name,
        durationMs: Date.now() - start,
        success: false,
        error: (err as Error).message,
      });
      throw err;
    }
  }
}

export const llmService = new LlmService();
