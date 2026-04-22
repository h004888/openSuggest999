import { z } from "zod";

export const CursorSchema = z.object({
  line: z.number().int().min(0),
  character: z.number().int().min(0)
});

export const InlineCompletionRequestSchema = z.object({
  language: z.string().min(1),
  filePath: z.string().min(1),
  cursor: CursorSchema,
  prefix: z.string().max(12000),
  suffix: z.string().max(6000),
  editor: z.string().optional(),
  requestId: z.string().optional()
});

export const InlineCompletionResponseSchema = z.object({
  suggestion: z.string(),
  stopReason: z.string().optional(),
  model: z.string(),
  latencyMs: z.number().int().nonnegative(),
  cached: z.boolean()
});

export type Cursor = z.infer<typeof CursorSchema>;
export type InlineCompletionRequest = z.infer<typeof InlineCompletionRequestSchema>;
export type InlineCompletionResponse = z.infer<typeof InlineCompletionResponseSchema>;
