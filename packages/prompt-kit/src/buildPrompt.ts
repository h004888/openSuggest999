export type PromptInput = {
  language: string;
  prefix: string;
  suffix: string;
  filePath: string;
};

export type CompletionPrompt = {
  systemPrompt: string;
  userPrompt: string;
};

const SYSTEM_BASE = [
  "You are an inline code completion engine.",
  "Return exactly one JSON object with a single string field named completion.",
  "Example: {\"completion\":\"value\"}",
  "Do not return markdown, backticks, comments, XML, explanations, or any text before or after the JSON.",
  "The completion value must contain only the missing code at the cursor.",
  "Complete only the next short continuation, not a whole function or file.",
  "Prefer one short line or a very small number of tokens.",
  "Stop as soon as the completion is useful for ghost text.",
  "Keep style and naming consistent with the provided code."
].join(" ");

export function buildPrompt(input: PromptInput): CompletionPrompt {
  const languageHints = getLanguageHints(input.language);
  const systemPrompt = `${SYSTEM_BASE} ${languageHints}`;

  const userPrompt = [
    `Language: ${input.language}`,
    `File: ${input.filePath}`,
    "Task: Return exactly one JSON object with field completion.",
    "Rules:",
    "- Output valid JSON only.",
    "- Schema: {\"completion\":\"string\"}.",
    "- completion must contain only code.",
    "- No prose, no markdown, no backticks.",
    "- Prefer a single short line.",
    "- Do not repeat the prefix.",
    "- Stop before writing unrelated code.",
    "<PREFIX>",
    input.prefix,
    "</PREFIX>",
    "<SUFFIX>",
    input.suffix,
    "</SUFFIX>"
  ].join("\n");

  return {
    systemPrompt,
    userPrompt
  };
}

function getLanguageHints(language: string): string {
  const hints: Record<string, string> = {
    typescript: "Use TypeScript conventions. Prefer interfaces over types when appropriate. Include proper typing for function parameters and return values.",
    javascript: "Follow modern JavaScript (ES6+). Use const/let appropriately. Prefer arrow functions and destructuring.",
    python: "Follow PEP 8 conventions. Use snake_case for functions/variables. Prefer list comprehensions. Use proper indentation.",
    go: "Follow Go idioms. Use error wrapping. Keep functions short. Prefer composition over inheritance.",
    rust: "Follow Rust idioms. Use Result for error handling. Prefer pattern matching. Memory safety is critical.",
    java: "Follow Java conventions. Use proper OOP patterns. Prefer interfaces for abstractions.",
    cpp: "Follow C++ idioms. Use RAII for resource management. Prefer modern C++ features.",
    csharp: "Follow C# conventions. Use LINQ appropriately. Prefer async/await.",
  };
  return hints[language.toLowerCase()] || "Follow the language's conventions and idioms.";
}
