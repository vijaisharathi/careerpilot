import { ILlmProvider, LlmCompletionOptions, LlmCompletionResponse, LlmMessage } from '../llm.interface';

export class MockLlmProvider implements ILlmProvider {
  public readonly name = 'mock';

  public isConfigured(): boolean {
    return true;
  }

  public async generateCompletion(
    prompt: string,
    options?: LlmCompletionOptions
  ): Promise<LlmCompletionResponse> {
    const model = options?.model ?? 'mock-career-pilot-v1';
    const simulatedResponse = this.generateSimulatedCareerResponse(prompt);

    return {
      text: simulatedResponse,
      provider: this.name,
      model,
      isSimulated: true,
      usage: {
        promptTokens: Math.round(prompt.length / 4),
        completionTokens: Math.round(simulatedResponse.length / 4),
        totalTokens: Math.round((prompt.length + simulatedResponse.length) / 4),
      },
    };
  }

  public async generateChat(
    messages: LlmMessage[],
    options?: LlmCompletionOptions
  ): Promise<LlmCompletionResponse> {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
    return this.generateCompletion(lastUserMessage, options);
  }

  private generateSimulatedCareerResponse(query: string): string {
    return (
      `[SIMULATED RESPONSE: Running in mock development mode. Connect an API key (GEMINI_API_KEY or OPENAI_API_KEY) in .env for live LLM responses.]\n\n` +
      `Career Guidance Analysis for: "${query.slice(0, 100)}"\n\n` +
      `1. Suggested Career Paths:\n` +
      `   - Full-Stack Software Engineer (High growth, high demand)\n` +
      `   - Cloud & DevOps Specialist\n` +
      `   - AI/Data Solutions Engineer\n\n` +
      `2. Recommended Key Competencies:\n` +
      `   - Modern JavaScript/TypeScript, React, Node.js\n` +
      `   - Database design (MongoDB, PostgreSQL)\n` +
      `   - System design, Docker & CI/CD deployment\n\n` +
      `3. Actionable Next Steps:\n` +
      `   - Complete 2 end-to-end fullstack portfolio projects\n` +
      `   - Practice data structures and algorithms on LeetCode/HackerRank\n` +
      `   - Optimize LinkedIn and prepare for behavioral + technical mock interviews`
    );
  }
}
