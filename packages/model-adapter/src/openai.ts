import type {
  CompletionModelAdapter,
  CompletionModelInput,
  CompletionModelResult
} from "./base.js";
import OpenAI from "openai";

export type OpenAIAdapterOptions = {
  apiKey: string;
  model: string;
  baseUrl?: string;
  timeoutMs?: number;
  extraHeaders?: Record<string, string>;
  extraBody?: Record<string, unknown>;
};

type OpenAIChatCompletionResponse = {
  model?: string;
  choices?: Array<{
    finish_reason?: string;
    message?: {
      content?:
        | string
        | Array<{
            type?: string;
            text?: string;
          }>;
    };
  }>;
};

type OpenAIMessageContent =
  | string
  | Array<{
      type?: string;
      text?: string;
    }>
  | null
  | undefined;

function extractMessageText(content: OpenAIMessageContent): string {
  if (!content) {
    return "";
  }

  if (typeof content === "string") {
    return content;
  }

  return content
    .map((part) => (part.type === "text" || !part.type ? (part.text ?? "") : ""))
    .join("");
}

export class OpenAIAdapter implements CompletionModelAdapter {
  private readonly model: string;
  private readonly client: OpenAI;
  private readonly extraBody?: Record<string, unknown>;

  constructor(options: OpenAIAdapterOptions) {
    this.model = options.model;
    this.client = new OpenAI({
      apiKey: options.apiKey,
      baseURL: options.baseUrl ?? "https://api.openai.com/v1",
      defaultHeaders: options.extraHeaders,
      timeout: options.timeoutMs ?? 1500
    });
    this.extraBody = options.extraBody;
  }

  async complete(input: CompletionModelInput): Promise<CompletionModelResult> {
    const requestBody: Record<string, unknown> = {
      model: this.model,
      temperature: input.temperature,
      max_tokens: input.maxTokens,
      messages: [
        { role: "system", content: input.systemPrompt },
        { role: "user", content: input.userPrompt }
      ]
    };

    if (this.extraBody) {
      Object.assign(requestBody, this.extraBody);
    }

    const response = (await this.client.chat.completions.create(
      requestBody as any,
      input.requestId
        ? {
            headers: {
              "X-Client-Request-Id": input.requestId
            }
          }
        : undefined
    )) as OpenAIChatCompletionResponse;

    const first = response.choices?.[0];
    const text = extractMessageText(first?.message?.content);

    return {
      suggestion: text,
      model: response.model ?? this.model,
      stopReason: first?.finish_reason
    };
  }
}
