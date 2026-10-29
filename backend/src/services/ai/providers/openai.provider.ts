import { ILlmProvider, LlmCompletionOptions, LlmCompletionResponse, LlmMessage } from '../llm.interface';
import { env } from '../../../config/env';
import { AppError } from '../../../utils/appError';

export class OpenAiLlmProvider implements ILlmProvider {
  public readonly name = 'openai';

  public isConfigured(): boolean {
    return Boolean(env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim().length > 0);
  }

  public async generateCompletion(
    prompt: string,
    options?: LlmCompletionOptions
  ): Promise<LlmCompletionResponse> {
    return this.generateChat([{ role: 'user', content: prompt }], options);
  }

  public async generateChat(
    messages: LlmMessage[],
    options?: LlmCompletionOptions
  ): Promise<LlmCompletionResponse> {
    if (!this.isConfigured()) {
      throw AppError.badRequest(
        'OpenAI provider is selected, but OPENAI_API_KEY is not configured in backend/.env'
      );
    }

    const model = options?.model || 'gpt-4o-mini';
    const endpoint = 'https://api.openai.com/v1/chat/completions';

    const payload = {
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AppError(`OpenAI API error (${response.status}): ${errorText}`, 502);
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: { content?: string };
      }>;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    };

    const generatedText = data.choices?.[0]?.message?.content ?? '';

    return {
      text: generatedText,
      provider: this.name,
      model,
      isSimulated: false,
      usage: {
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens,
      },
    };
  }
}
