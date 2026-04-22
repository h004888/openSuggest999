export type CompletionModelInput = {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  temperature: number;
  requestId?: string;
};

export type CompletionModelResult = {
  suggestion: string;
  model: string;
  stopReason?: string;
};

export interface CompletionModelAdapter {
  complete(input: CompletionModelInput): Promise<CompletionModelResult>;
}
