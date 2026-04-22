# API Contract

## POST /v1/completions/inline

Request:

- `language`: string
- `filePath`: string
- `cursor`: `{ line: number, character: number }`
- `prefix`: string
- `suffix`: string
- `editor`: optional string
- `requestId`: optional string

Response:

- `suggestion`: string
- `model`: string
- `latencyMs`: number
- `cached`: boolean
- `stopReason`: optional string

## Upstream LLM API standard

The backend uses OpenAI-compatible Chat Completions:

- `POST {OPEN_SUGGEST_OPENAI_BASE_URL}/chat/completions`
- `Authorization: Bearer <OPEN_SUGGEST_OPENAI_API_KEY>`
- Optional trace header: `X-Client-Request-Id` (forwarded from request `requestId`)
- Optional provider-specific body fields via `OPEN_SUGGEST_OPENAI_EXTRA_BODY_JSON`
