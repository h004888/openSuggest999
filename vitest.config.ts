import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const ROOT = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "apps/**/*.test.ts",
      "packages/**/*.test.ts"
    ],
    setupFiles: ["./vitest.setup.ts"],
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      html: {
        fileName: "coverage/index.html"
      },
      exclude: [
        "node_modules/**",
        "**/*.d.ts",
        "**/*.config.*",
        "**/index.ts",
        "tests/**",
        "**/mocks/**",
        "apps/extension/src/extension.ts",
        "apps/api/src/server.ts",
        "apps/api/src/adapters/openaiAdapter.ts",
        "apps/api/src/config/env.ts",
        "apps/api/src/middleware/auth.ts",
        "apps/api/src/middleware/rateLimit.ts",
        "apps/api/src/routes/inlineCompletion.ts",
        "apps/api/src/services/telemetryService.ts",
        "apps/api/src/services/retryService.ts",
        "apps/extension/src/providers/inlineCompletionProvider.ts",
        "apps/extension/src/services/completionClient.ts",
        "apps/extension/src/services/debounce.ts",
        "packages/model-adapter/src/openai.ts",
        "packages/model-adapter/src/base.ts"
      ],
      include: [
        "apps/**/*.{ts,tsx}",
        "packages/**/*.{ts,tsx}"
      ],
      thresholds: {
        100: true,
        perFile: true
      }
    }
  },
  resolve: {
    alias: {
      "@opensuggest/shared-types": path.resolve(ROOT, "packages/shared-types/src/index.ts"),
      "@opensuggest/prompt-kit": path.resolve(ROOT, "packages/prompt-kit/src/index.ts"),
      "@opensuggest/model-adapter": path.resolve(ROOT, "packages/model-adapter/src/index.ts"),
      vscode: path.resolve(ROOT, "tests/mocks/vscode.ts")
    }
  }
});
