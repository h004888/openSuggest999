import { beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";
import { OpenSuggestInlineCompletionProvider } from "./inlineCompletionProvider";
import type { CompletionClient } from "../services/completionClient";
import type { DebounceGate } from "../services/debounce";

describe("OpenSuggestInlineCompletionProvider", () => {
  let mockClient: Pick<CompletionClient, "fetchInlineCompletion">;
  let mockDebounceGate: Pick<DebounceGate, "allow">;
  let provider: OpenSuggestInlineCompletionProvider;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockClient = {
      fetchInlineCompletion: vi.fn()
    };
    mockDebounceGate = {
      allow: vi.fn()
    };
    provider = new OpenSuggestInlineCompletionProvider(mockClient as CompletionClient, mockDebounceGate as DebounceGate);
  });

  function createDocument(lineText: string) {
    return {
      uri: { toString: () => "file:///test.ts", fsPath: "test.ts" },
      languageId: "typescript",
      lineCount: 1,
      lineAt: vi.fn().mockReturnValue({
        text: lineText,
        range: { end: new vscode.Position(0, lineText.length) }
      }),
      getText: vi.fn((range?: { start?: { character: number }; end?: { character: number } }) => {
        if (!range) {
          return lineText;
        }
        const start = range.start?.character ?? 0;
        const end = range.end?.character ?? lineText.length;
        return lineText.slice(start, end);
      })
    } as any;
  }

  it("returns null when debounce blocks the request", async () => {
    mockDebounceGate.allow = vi.fn().mockReturnValue(false);

    const result = await provider.provideInlineCompletionItems(
      createDocument("const hello"),
      new vscode.Position(0, 11),
      {} as any,
      { isCancellationRequested: false } as any
    );

    expect(result).toBeNull();
  });

  it("returns completion item when client returns suggestion", async () => {
    mockDebounceGate.allow = vi.fn().mockReturnValue(true);
    mockClient.fetchInlineCompletion = vi.fn().mockResolvedValue({
      suggestion: "()",
      model: "test-model",
      latencyMs: 10,
      cached: false
    });

    const result = await provider.provideInlineCompletionItems(
      createDocument("hello"),
      new vscode.Position(0, 5),
      {} as any,
      { isCancellationRequested: false } as any
    );

    expect(result).not.toBeNull();
    expect(result?.items).toHaveLength(1);
    expect(result?.items[0]?.insertText).toBe("()");
    expect(result?.items[0]?.range).toEqual(new vscode.Range(new vscode.Position(0, 5), new vscode.Position(0, 5)));
    expect(mockClient.fetchInlineCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        language: "typescript",
        filePath: "test.ts",
        editor: "vscode",
        prefix: "hello"
      }),
      expect.objectContaining({ isCancellationRequested: false })
    );
  });

  it("returns null when suggestion is duplicate prefix", async () => {
    mockDebounceGate.allow = vi.fn().mockReturnValue(true);
    mockClient.fetchInlineCompletion = vi.fn().mockResolvedValue({
      suggestion: "hello",
      model: "test-model",
      latencyMs: 10,
      cached: false
    });

    const result = await provider.provideInlineCompletionItems(
      createDocument("hello"),
      new vscode.Position(0, 5),
      {} as any,
      { isCancellationRequested: false } as any
    );

    expect(result).toBeNull();
  });

  it("returns null when client returns null", async () => {
    mockDebounceGate.allow = vi.fn().mockReturnValue(true);
    mockClient.fetchInlineCompletion = vi.fn().mockResolvedValue(null);

    const result = await provider.provideInlineCompletionItems(
      createDocument("const hello"),
      new vscode.Position(0, 11),
      {} as any,
      { isCancellationRequested: false } as any
    );

    expect(result).toBeNull();
  });

  it("returns completion when response arrives after cancellation but context is still current", async () => {
    mockDebounceGate.allow = vi.fn().mockReturnValue(true);
    mockClient.fetchInlineCompletion = vi.fn().mockResolvedValue({
      suggestion: " test",
      model: "test-model",
      latencyMs: 10,
      cached: false
    });

    const result = await provider.provideInlineCompletionItems(
      createDocument("const hello"),
      new vscode.Position(0, 11),
      {} as any,
      { isCancellationRequested: true } as any
    );

    expect(result).not.toBeNull();
    expect(result?.items[0]?.insertText).toBe("test");
  });

  it("returns null when prefix is empty", async () => {
    mockDebounceGate.allow = vi.fn().mockReturnValue(true);

    const result = await provider.provideInlineCompletionItems(
      createDocument(""),
      new vscode.Position(0, 0),
      {} as any,
      { isCancellationRequested: false } as any
    );

    expect(result).toBeNull();
  });

  it("returns null when trigger character is a newline", async () => {
    mockDebounceGate.allow = vi.fn().mockReturnValue(true);

    const result = await provider.provideInlineCompletionItems(
      createDocument("const value = 1\n"),
      new vscode.Position(0, 16),
      {} as any,
      { isCancellationRequested: false } as any
    );

    expect(result).toBeNull();
  });

  it("returns null when current token prefix is too short", async () => {
    mockDebounceGate.allow = vi.fn().mockReturnValue(true);

    const result = await provider.provideInlineCompletionItems(
      createDocument("ab"),
      new vscode.Position(0, 2),
      {} as any,
      { isCancellationRequested: false } as any
    );

    expect(result).toBeNull();
  });

  it("returns null when context changed before render", async () => {
    mockDebounceGate.allow = vi.fn().mockReturnValue(true);

    let currentText = "hello";
    mockClient.fetchInlineCompletion = vi.fn().mockImplementation(async () => {
      currentText = "world";
      return {
        suggestion: "()",
        model: "test-model",
        latencyMs: 10,
        cached: false
      };
    });

    const document = createDocument(currentText) as any;
    document.getText = vi.fn((range?: { start?: { character: number }; end?: { character: number } }) => {
      if (!range) {
        return currentText;
      }
      const start = range.start?.character ?? 0;
      const end = range.end?.character ?? currentText.length;
      return currentText.slice(start, end);
    });
    document.lineAt = vi.fn(() => ({
      text: currentText,
      range: { end: new vscode.Position(0, currentText.length) }
    }));

    const result = await provider.provideInlineCompletionItems(
      document,
      new vscode.Position(0, 5),
      {} as any,
      { isCancellationRequested: false } as any
    );

    expect(result).toBeNull();
  });


  it("allows newline inside prefix when latest trigger character is not newline", async () => {
    mockDebounceGate.allow = vi.fn().mockReturnValue(true);
    mockClient.fetchInlineCompletion = vi.fn().mockResolvedValue({
      suggestion: "()",
      model: "test-model",
      latencyMs: 10,
      cached: false
    });

    const result = await provider.provideInlineCompletionItems(
      createDocument("const value = 1\nfoo"),
      new vscode.Position(0, 19),
      {} as any,
      { isCancellationRequested: false } as any
    );

    expect(result).not.toBeNull();
  });

  it("returns null when trailing token is too short even with multiline context", async () => {
    mockDebounceGate.allow = vi.fn().mockReturnValue(true);
    mockClient.fetchInlineCompletion = vi.fn().mockResolvedValue({
      suggestion: "()",
      model: "test-model",
      latencyMs: 10,
      cached: false
    });

    const result = await provider.provideInlineCompletionItems(
      createDocument("const foo = bar\nba"),
      new vscode.Position(0, 18),
      {} as any,
      { isCancellationRequested: false } as any
    );

    expect(result).toBeNull();
  });

  it("returns null when suggestion is sanitized to empty", async () => {
    mockDebounceGate.allow = vi.fn().mockReturnValue(true);
    mockClient.fetchInlineCompletion = vi.fn().mockResolvedValue({
      suggestion: "   ",
      model: "test-model",
      latencyMs: 10,
      cached: false
    });

    const result = await provider.provideInlineCompletionItems(
      createDocument("const foo"),
      new vscode.Position(0, 9),
      {} as any,
      { isCancellationRequested: false } as any
    );

    expect(result).toBeNull();
  });

  it("returns null when another request for the same document is already in flight", async () => {
    mockDebounceGate.allow = vi.fn().mockReturnValue(true);

    let releaseFirst: ((value: { suggestion: string; model: string; latencyMs: number; cached: boolean }) => void) | undefined;
    mockClient.fetchInlineCompletion = vi.fn().mockImplementation(
      () => new Promise((resolve) => {
        releaseFirst = resolve;
      })
    );

    const document = createDocument("const hello");
    const firstPromise = provider.provideInlineCompletionItems(
      document,
      new vscode.Position(0, 11),
      {} as any,
      { isCancellationRequested: false } as any
    );

    const secondResult = await provider.provideInlineCompletionItems(
      document,
      new vscode.Position(0, 11),
      {} as any,
      { isCancellationRequested: false } as any
    );

    expect(secondResult).toBeNull();
    expect(mockClient.fetchInlineCompletion).toHaveBeenCalledTimes(1);

    releaseFirst?.({
      suggestion: "()",
      model: "test-model",
      latencyMs: 10,
      cached: false
    });

    const firstResult = await firstPromise;
    expect(firstResult).not.toBeNull();
  });
});
