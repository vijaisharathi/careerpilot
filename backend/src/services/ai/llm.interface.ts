export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  systemInstruction?: string;
}

export interface LlmCompletionResponse {
  text: string;
  provider: string;
  model: string;
  isSimulated: boolean;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface ILlmProvider {
  readonly name: string;
  isConfigured(): boolean;
  generateCompletion(prompt: string, options?: LlmCompletionOptions): Promise<LlmCompletionResponse>;
  generateChat(messages: LlmMessage[], options?: LlmCompletionOptions): Promise<LlmCompletionResponse>;
}
