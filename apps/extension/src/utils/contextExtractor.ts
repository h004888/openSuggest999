import * as vscode from "vscode";

export type CompletionContext = {
  prefix: string;
  suffix: string;
};

export function extractContext(
  document: vscode.TextDocument,
  position: vscode.Position,
  lineWindow = 20,
  maxPrefixChars = 2400,
  maxSuffixChars = 1200
): CompletionContext {
  const startLine = Math.max(0, position.line - lineWindow);
  const endLine = Math.min(document.lineCount - 1, position.line + lineWindow);

  const prefixRange = new vscode.Range(new vscode.Position(startLine, 0), position);
  const suffixRange = new vscode.Range(
    position,
    document.lineAt(endLine).range.end
  );

  const fullPrefix = document.getText(prefixRange);
  const fullSuffix = document.getText(suffixRange);

  return {
    prefix: fullPrefix.slice(-maxPrefixChars),
    suffix: fullSuffix.slice(0, maxSuffixChars)
  };
}
