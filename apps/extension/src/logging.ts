let outputChannel: { appendLine: (value: string) => void } | undefined;

function stringifyArg(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function write(level: "info" | "warn" | "error" | "debug", message: string, args: unknown[]): void {
  const formatted = `[OpenSuggest] ${message}${args.length ? ` ${args.map(stringifyArg).join(" ")}` : ""}`;
  const consoleMethod = console[level] ?? console.log;
  consoleMethod(formatted);
  outputChannel?.appendLine(formatted);
}

export function setOutputChannel(channel: { appendLine: (value: string) => void } | undefined): void {
  outputChannel = channel;
}

export const logger = {
  info(message: string, ...args: unknown[]): void {
    write("info", message, args);
  },
  warn(message: string, ...args: unknown[]): void {
    write("warn", message, args);
  },
  error(message: string, ...args: unknown[]): void {
    write("error", message, args);
  },
  debug(message: string, ...args: unknown[]): void {
    write("debug", message, args);
  }
};
