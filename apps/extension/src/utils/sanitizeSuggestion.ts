export function sanitizeSuggestion(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }

  const withoutThinking = trimmed.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  const fencedBlockMatch = withoutThinking.match(/```[a-zA-Z0-9_-]*\s*\n([\s\S]*?)\n```/);
  if (fencedBlockMatch?.[1]) {
    return fencedBlockMatch[1].trim();
  }

  const withoutCodeFence = withoutThinking
    .replace(/^```[a-zA-Z]*\n?/, "")
    .replace(/```$/g, "")
    .trim();

  return withoutCodeFence;
}
