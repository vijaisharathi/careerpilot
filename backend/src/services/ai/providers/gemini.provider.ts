import { ILlmProvider, LlmCompletionOptions, LlmCompletionResponse, LlmMessage } from '../llm.interface';
import { env } from '../../../config/env';
import { AppError } from '../../../utils/appError';

export class GeminiLlmProvider implements ILlmProvider {
  public readonly name = 'gemini';

  public isConfigured(): boolean {
    return Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0);
  }

  public async generateCompletion(
    prompt: string,
    options?: LlmCompletionOptions
  ): Promise<LlmCompletionResponse> {
    if (!this.isConfigured()) {
      throw AppError.badRequest(
        'Gemini provider is selected, but GEMINI_API_KEY is not configured in backend/.env'
      );
    }

    const model = options?.model || 'gemini-1.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 1024,
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AppError(`Gemini API error (${response.status}): ${errorText}`, 502);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text: string }>;
        };
      }>;
      usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
      };
    };

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    return {
      text: generatedText,
      provider: this.name,
      model,
      isSimulated: false,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount,
        completionTokens: data.usageMetadata?.candidatesTokenCount,
        totalTokens: data.usageMetadata?.totalTokenCount,
      },
    };
  }

  public async generateChat(
    messages: LlmMessage[],
    options?: LlmCompletionOptions
  ): Promise<LlmCompletionResponse> {
    const combinedPrompt = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    return this.generateCompletion(combinedPrompt, options);
  }
}
