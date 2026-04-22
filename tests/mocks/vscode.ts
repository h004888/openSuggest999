export class Position {
  constructor(
    public readonly line: number,
    public readonly character: number
  ) {}
}

export class Range {
  constructor(
    public readonly start: Position,
    public readonly end: Position
  ) {}
}

export class InlineCompletionItem {
  constructor(
    public readonly insertText: string,
    public readonly range: Range
  ) {}
}

export class InlineCompletionList {
  constructor(public readonly items: InlineCompletionItem[]) {}
}

type Disposable = { dispose: () => void };
type ConfigListener = (event: { affectsConfiguration: (section: string) => boolean }) => void;

let currentConfig: Record<string, unknown> = {};
let configListeners: ConfigListener[] = [];
let registeredProvider:
  | { selector: unknown; provider: unknown; disposable: Disposable }
  | undefined;
let createdOutputChannels: Array<{ name: string; lines: string[]; appendLine: (value: string) => void; dispose: () => void }> = [];

function createDisposable(): Disposable {
  return {
    dispose() {
      return;
    }
  };
}

export function __setConfig(config: Record<string, unknown>): void {
  currentConfig = { ...config };
}

export function __reset(): void {
  currentConfig = {};
  configListeners = [];
  registeredProvider = undefined;
  createdOutputChannels = [];
}

export function __fireConfigurationChange(section: string): void {
  const event = {
    affectsConfiguration(target: string): boolean {
      return target === section;
    }
  };

  for (const listener of configListeners) {
    listener(event);
  }
}

export function __getRegisteredInlineCompletionProvider() {
  return registeredProvider;
}

export function __getOutputChannels() {
  return createdOutputChannels;
}

export const workspace = {
  getConfiguration(section?: string) {
    return {
      get<T>(key: string, defaultValue?: T): T {
        const scopedKey = section ? `${section}.${key}` : key;
        if (scopedKey in currentConfig) {
          return currentConfig[scopedKey] as T;
        }
        if (key in currentConfig) {
          return currentConfig[key] as T;
        }
        return defaultValue as T;
      }
    };
  },
  onDidChangeConfiguration(listener: ConfigListener): Disposable {
    configListeners.push(listener);
    return createDisposable();
  }
};

export const languages = {
  registerInlineCompletionItemProvider(selector: unknown, provider: unknown): Disposable {
    const disposable = createDisposable();
    registeredProvider = { selector, provider, disposable };
    return disposable;
  }
};

export const window = {
  createOutputChannel(name: string) {
    const channel = {
      name,
      lines: [] as string[],
      appendLine(value: string) {
        channel.lines.push(value);
      },
      dispose() {
        return;
      }
    };
    createdOutputChannels.push(channel);
    return channel;
  }
};
