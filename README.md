# OpenSuggest999

MVP monorepo for inline code completion in VS Code.

## Workspace

- `apps/api`: Completion API
- `apps/extension`: VS Code extension
- `packages/shared-types`: contract types and schemas
- `packages/prompt-kit`: prompt builder
- `packages/model-adapter`: OpenAI-compatible model adapter

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
copy .env.example .env
```

3. Configure OpenAI-compatible endpoint in `.env`:

- `OPEN_SUGGEST_OPENAI_API_KEY`: required
- `OPEN_SUGGEST_OPENAI_BASE_URL`: optional (default `https://api.openai.com/v1`)
- `OPEN_SUGGEST_OPENAI_MODEL`: optional
- `OPEN_SUGGEST_OPENAI_HEADERS_JSON`: optional JSON headers for compatible gateways

Example for Claude OpenAI SDK compatibility mode:

- `OPEN_SUGGEST_OPENAI_BASE_URL=https://api.anthropic.com/v1/`
- `OPEN_SUGGEST_OPENAI_API_KEY=<your_anthropic_api_key>`
- `OPEN_SUGGEST_OPENAI_MODEL=claude-sonnet-4-6`

Example for MiniMax OpenAI-compatible mode:

- `OPEN_SUGGEST_OPENAI_BASE_URL=https://api.minimax.io/v1`
- `OPEN_SUGGEST_OPENAI_API_KEY=<your_minimax_api_key>`
- `OPEN_SUGGEST_OPENAI_MODEL=MiniMax-M2.7`
- `OPEN_SUGGEST_OPENAI_FALLBACK_MODEL=MiniMax-M2.5`
- `OPEN_SUGGEST_OPENAI_EXTRA_BODY_JSON={"reasoning_split":true}`

MiniMax model policy in this project:

- Primary model: `MiniMax-M2.7`
- Fallback model: `MiniMax-M2.5`
- Highspeed model names are normalized to base models and not used directly.

4. Run API:

```bash
npm run dev:api
```

5. Build extension:

```bash
npm run build --prefix apps/extension
```

## API

- `GET /health`
- `POST /v1/completions/inline`

## Docs

- `docs/architecture.md`
- `docs/api-contract.md`
- `docs/extension-flow.md`
- `docs/system-visualize.md`
