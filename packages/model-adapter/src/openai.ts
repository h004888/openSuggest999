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
      stream: true,
      messages: [
        { role: "system", content: input.systemPrompt },
        { role: "user", content: input.userPrompt }
      ]
    };

    if (this.extraBody) {
      Object.assign(requestBody, this.extraBody);
    }

    const stream = await this.client.chat.completions.create(
      requestBody as any,
      input.requestId
        ? {
            headers: {
              "X-Client-Request-Id": input.requestId
            }
          }
        : undefined
    );

    let fullContent = "";
    let fullReasoning = "";
    let stopReason: string | undefined;
    let model: string | undefined;

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta;

      if (delta?.content !== undefined) {
        fullContent += delta.content;
      }

      // Handle reasoning details if present (MiniMax-specific)
      if ((delta as any)?.reasoning_details?.content !== undefined) {
        fullReasoning += (delta as any).reasoning_details.content;
      }

      if (chunk.choices?.[0]?.finish_reason) {
        stopReason = chunk.choices[0].finish_reason;
      }

      if (chunk.model) {
        model = chunk.model;
      }
    }

    return {
      suggestion: fullContent,
      model: model ?? this.model,
      stopReason
    };
  }
}
