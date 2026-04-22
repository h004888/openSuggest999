import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotEnv } from "dotenv";

// Simple logger using console
const log = {
  debug: (...args: unknown[]) => console.debug("[env-loader]", ...args),
  info: (...args: unknown[]) => console.info("[env-loader]", ...args),
  warn: (...args: unknown[]) => console.warn("[env-loader]", ...args),
  error: (...args: unknown[]) => console.error("[env-loader]", ...args),
};

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

let hasLoadedDotEnv = false;

const loadEnvOnce = (): void => {
  if (hasLoadedDotEnv) {
    return;
  }
  hasLoadedDotEnv = true;

  if (process.env.VITEST) {
    return;
  }

  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFile);

  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env"),
    path.resolve(currentDir, "../../../../.env")
  ];

  log.info({ candidates }, "Looking for .env files");

  for (const envPath of candidates) {
    if (!existsSync(envPath)) {
      continue;
    }

    log.info({ path: envPath }, "Loading env from file");
    loadDotEnv({ path: envPath });
    break;
  }

  // Debug: log what was loaded
  const apiKey = process.env.OPEN_SUGGEST_API_KEY;
  log.info({
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length ?? 0,
    apiKeyPrefix: apiKey?.substring(0, 4) ?? "none"
  }, "Env loaded - OPEN_SUGGEST_API_KEY");
};

const MINIMAX_MODEL_MAP: Record<string, string> = {
  "minimax-m2.7": "MiniMax-M2.7",
  "minimax-m2.5": "MiniMax-M2.5"
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return !!value && typeof value === "object" && !Array.isArray(value);
};

const parseJsonHeaders = (value: string | undefined): Record<string, string> | undefined => {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return undefined;
    }

    const entries = Object.entries(parsed);
    const headers: Record<string, string> = {};
    for (const [key, headerValue] of entries) {
      if (typeof headerValue === "string") {
        headers[key] = headerValue;
      }
    }

    return Object.keys(headers).length > 0 ? headers : undefined;
  } catch {
    return undefined;
  }
};

const parseJsonObject = (value: string | undefined): Record<string, unknown> | undefined => {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const isMiniMaxBaseUrl = (baseUrl: string): boolean => {
  return baseUrl.toLowerCase().includes("api.minimax.io");
};

const normalizeModelName = (model: string, baseUrl: string): string => {
  const trimmed = model.trim();
  if (!isMiniMaxBaseUrl(baseUrl)) {
    return trimmed;
  }

  const normalized = MINIMAX_MODEL_MAP[trimmed.toLowerCase()];
  return normalized ?? trimmed;
};

export type AppEnv = {
  port: number;
  openaiBaseUrl: string;
  model: string;
  fallbackModel?: string;
  timeoutMs: number;
  cacheTtlMs: number;
  rateLimitPerMin: number;
  appApiKey?: string;
  openaiApiKey: string;
  openaiExtraHeaders?: Record<string, string>;
  openaiExtraBody?: Record<string, unknown>;
};

export function getEnv(): AppEnv {
  loadEnvOnce();

  const openaiApiKey = process.env.OPEN_SUGGEST_OPENAI_API_KEY;
  if (!openaiApiKey) {
    log.error("Missing OPEN_SUGGEST_OPENAI_API_KEY");
    throw new Error(
      "Missing OPEN_SUGGEST_OPENAI_API_KEY. Set it in project .env or your shell environment."
    );
  }

  log.info({ key: "OPEN_SUGGEST_OPENAI_API_KEY", loaded: true }, "Env var");

  const openaiBaseUrl =
    process.env.OPEN_SUGGEST_OPENAI_BASE_URL ?? "https://api.openai.com/v1";

  const configuredModel =
    process.env.OPEN_SUGGEST_OPENAI_MODEL ??
    process.env.OPEN_SUGGEST_MODEL ??
    "gpt-4.1-mini";
  const normalizedModel = normalizeModelName(configuredModel, openaiBaseUrl);

  const configuredFallback =
    process.env.OPEN_SUGGEST_OPENAI_FALLBACK_MODEL ??
    process.env.OPEN_SUGGEST_FALLBACK_MODEL;
  const normalizedConfiguredFallback = configuredFallback
    ? normalizeModelName(configuredFallback, openaiBaseUrl)
    : undefined;

  const appApiKey = process.env.OPEN_SUGGEST_API_KEY;

  log.info({
    port: process.env.OPEN_SUGGEST_PORT ?? "3030 (default)",
    openaiBaseUrl,
    model: normalizedModel,
    fallbackModel: normalizedConfiguredFallback,
    appApiKey: appApiKey ? `***${appApiKey.slice(-4)}` : "none"
  }, "Final env configuration");

  return {
    port: toNumber(process.env.OPEN_SUGGEST_PORT, 3030),
    openaiBaseUrl,
    model: normalizedModel,
    fallbackModel: normalizedConfiguredFallback,
    timeoutMs: toNumber(process.env.OPEN_SUGGEST_TIMEOUT_MS, 1500),
    cacheTtlMs: toNumber(process.env.OPEN_SUGGEST_CACHE_TTL_MS, 30000),
    rateLimitPerMin: toNumber(process.env.OPEN_SUGGEST_RATE_LIMIT_PER_MIN, 30),
    appApiKey,
    openaiApiKey,
    openaiExtraHeaders: parseJsonHeaders(process.env.OPEN_SUGGEST_OPENAI_HEADERS_JSON),
    openaiExtraBody: parseJsonObject(process.env.OPEN_SUGGEST_OPENAI_EXTRA_BODY_JSON)
  };
}