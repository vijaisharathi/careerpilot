import { describe, it, expect } from 'vitest';
import { MockLlmProvider } from '../src/services/ai/providers/mock.provider';
import { LlmService } from '../src/services/ai/llm.service';

describe('Provider-Independent LLM Integration', () => {
  it('MockLlmProvider should generate transparent simulated responses', async () => {
    const mock = new MockLlmProvider();
    expect(mock.name).toBe('mock');
    expect(mock.isConfigured()).toBe(true);

    const result = await mock.generateCompletion('Software engineer internship advice');

    expect(result.provider).toBe('mock');
    expect(result.isSimulated).toBe(true);
    expect(result.text).toContain('SIMULATED RESPONSE');
    expect(result.usage).toBeDefined();
  });

  it('LlmService facade returns correct provider status', () => {
    const service = new LlmService();
    const status = service.getStatus();

    expect(status.supportedProviders).toEqual(['mock', 'gemini', 'openai']);
    expect(status.activeProvider).toBeDefined();
  });
});
