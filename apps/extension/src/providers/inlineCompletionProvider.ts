import * as vscode from "vscode";
import { logger } from "../logging";
import type { CompletionClient } from "../services/completionClient";
import type { DebounceGate, DebounceContext } from "../services/debounce";
import type { InlineCompletionRequest } from "../types/completion";
import { extractContext, type CompletionContext } from "../utils/contextExtractor";
import { sanitizeSuggestion } from "../utils/sanitizeSuggestion";

const MIN_PREFIX_LENGTH = 3;
const SKIPPED_TRIGGER_CHARACTERS = new Set(["\n", "\r"]);

function isContextStillCurrent(
  document: vscode.TextDocument,
  position: vscode.Position,
  context: CompletionContext
): boolean {
  const latestContext = extractContext(document, position);
  return latestContext.prefix === context.prefix && latestContext.suffix === context.suffix;
}

export class OpenSuggestInlineCompletionProvider
  implements vscode.InlineCompletionItemProvider
{
  private readonly inFlightKeys = new Set<string>();

  constructor(
    private readonly client: CompletionClient,
    private readonly debounceGate: DebounceGate
  ) {}

  private getDocumentKey(document: vscode.TextDocument): string {
    return `${document.uri.toString()}:${document.languageId}`;
  }

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.InlineCompletionList | null> {
    // Extract context for debounce decision
    const context = extractContext(document, position);
    const currentLine = document.lineAt(position.line) as vscode.TextLine & { text?: string };
    const lineText =
      currentLine.text ??
      document.getText(new vscode.Range(new vscode.Position(position.line, 0), currentLine.range.end));

    // Build debounce context
    const debounceContext: DebounceContext = {
      triggerCharacter: context.prefix.slice(-1) || '',
      isLineEnd: position.character >= lineText.trimEnd().length,
      isDocumentEnd: position.line === document.lineCount - 1 &&
                     position.character === lineText.length,
      manuallyTriggered: false
    };

    // Check debounce gate
    if (!this.debounceGate.allow(document.uri.toString(), debounceContext)) {
      logger.debug("Inline completion skipped: debounced", {
        filePath: document.uri.fsPath,
        debounceContext
      });
      return null;
    }

    const trimmedPrefix = context.prefix.trim();
    if (!trimmedPrefix) {
      logger.debug("Inline completion skipped: empty prefix", {
        filePath: document.uri.fsPath,
        position
      });
      return null;
    }

    const triggerCharacter = context.prefix.slice(-1);
    if (SKIPPED_TRIGGER_CHARACTERS.has(triggerCharacter)) {
      logger.debug("Inline completion skipped: unsupported trigger character", {
        filePath: document.uri.fsPath,
        triggerCharacter
      });
      return null;
    }

    const prefixTail = trimmedPrefix.split(/\s+/).at(-1) ?? trimmedPrefix;
    if (prefixTail.length < MIN_PREFIX_LENGTH) {
      logger.debug("Inline completion skipped: prefix too short", {
        filePath: document.uri.fsPath,
        prefixTailLength: prefixTail.length
      });
      return null;
    }

    const request: InlineCompletionRequest = {
      language: document.languageId,
      filePath: document.uri.fsPath,
      cursor: {
        line: position.line,
        character: position.character
      },
      prefix: context.prefix,
      suffix: context.suffix,
      editor: "vscode",
      requestId: crypto.randomUUID()
    };

    const documentKey = this.getDocumentKey(document);
    if (this.inFlightKeys.has(documentKey)) {
      logger.debug("Inline completion skipped: request already in flight", {
        filePath: request.filePath,
        documentKey
      });
      return null;
    }

    this.inFlightKeys.add(documentKey);

    const response = await this.client.fetchInlineCompletion(request, token);
    this.inFlightKeys.delete(documentKey);
    if (!response) {
      logger.debug("Inline completion skipped: client returned null", {
        requestId: request.requestId,
        filePath: request.filePath
      });
      return null;
    }

    if (!isContextStillCurrent(document, position, context)) {
      logger.debug("Inline completion skipped: stale context", {
        requestId: request.requestId,
        filePath: request.filePath
      });
      return null;
    }

    if (token.isCancellationRequested) {
      logger.debug("Inline completion response arrived after cancellation", {
        requestId: request.requestId,
        filePath: request.filePath
      });
    }

    const suggestion = sanitizeSuggestion(response.suggestion);
    if (!suggestion) {
      logger.debug("Inline completion skipped: suggestion empty after sanitize", {
        requestId: request.requestId,
        rawSuggestionLength: response.suggestion.length
      });
      return null;
    }

    if (request.prefix.endsWith(suggestion)) {
      logger.debug("Inline completion skipped: suggestion already typed", {
        requestId: request.requestId,
        suggestion
      });
      return null;
    }

    logger.debug("Inline completion ready", {
      requestId: request.requestId,
      suggestionLength: suggestion.length,
      filePath: request.filePath
    });

    return new vscode.InlineCompletionList([
      new vscode.InlineCompletionItem(suggestion, new vscode.Range(position, position))
    ]);
  }
}
