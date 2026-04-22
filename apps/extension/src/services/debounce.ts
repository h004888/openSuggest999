export interface DebounceContext {
  triggerCharacter: string;
  isLineEnd: boolean;
  isDocumentEnd: boolean;
  manuallyTriggered: boolean;
}

interface DebounceConfig {
  baseInterval: number;
  minInterval: number;
  maxInterval: number;
  contextWeights: {
    triggerCharacter: number;
    lineEnd: number;
    documentEnd: number;
  };
}

export class DebounceGate {
  private readonly timestamps = new Map<string, number>();
  private debounceMs: number;
  private intervalHistory: number[] = [];
  private config: DebounceConfig = {
    baseInterval: 200,
    minInterval: 100,
    maxInterval: 400,
    contextWeights: {
      triggerCharacter: 0.5,
      lineEnd: 0.4,
      documentEnd: 0.1
    }
  };

  constructor(debounceMs: number = 200) {
    this.debounceMs = debounceMs;
    // Cleanup old timestamps every 5 minutes
    setInterval(() => this.cleanupStaleTimestamps(), 5 * 60 * 1000);
  }

  private cleanupStaleTimestamps(): void {
    const now = Date.now();
    const staleThreshold = 10 * 60 * 1000; // 10 minutes
    for (const [key, timestamp] of this.timestamps.entries()) {
      if (now - timestamp > staleThreshold) {
        this.timestamps.delete(key);
      }
    }
  }

  updateDebounceMs(ms: number): void {
    console.log(`[OpenSuggest] Debounce updated: ${ms}ms`);
    this.debounceMs = ms;
  }

  updateConfig(newConfig: Partial<DebounceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  private clamp(min: number, max: number, value: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private calcContextScore(ctx: DebounceContext): number {
    const { triggerCharacter = "", isLineEnd, isDocumentEnd } = ctx;
    const { contextWeights } = this.config;

    let score = 0;
    // Trigger character (punctuation/whitespace) suggests higher acceptance chance
    score += triggerCharacter.match(/^\W*$/) ? contextWeights.triggerCharacter : 0;
    // At end of line, more likely to accept completion
    score += isLineEnd ? contextWeights.lineEnd : 0;
    // At end of document, more likely to accept
    score += isDocumentEnd ? contextWeights.documentEnd : 0;

    return this.clamp(0, 1, score);
  }

  allow(key: string, contextOrNow?: DebounceContext | number): boolean {
    const now = typeof contextOrNow === "number" ? contextOrNow : Date.now();
    const last = this.timestamps.get(key) ?? 0;

    // Calculate adaptive interval based on context
    let effectiveDebounce = this.debounceMs;
    if (contextOrNow && typeof contextOrNow !== "number" && !contextOrNow.manuallyTriggered) {
      const contextScore = this.calcContextScore(contextOrNow);
      // Higher context score = shorter debounce (more likely to accept)
      const adaptiveRate = 1 + (this.config.baseInterval - effectiveDebounce) / this.config.baseInterval * (1 - contextScore);
      effectiveDebounce = this.clamp(
        this.config.minInterval,
        this.config.maxInterval,
        effectiveDebounce * adaptiveRate
      );
    }

    if (now - last < effectiveDebounce) {
      console.debug(`[OpenSuggest] Debounce blocked (${effectiveDebounce}ms): ${key}`);
      return false;
    }

    // Track interval for adaptive learning
    if (last > 0) {
      const interval = now - last;
      if (interval <= this.config.maxInterval) {
        this.intervalHistory.push(interval);
        if (this.intervalHistory.length > 100) {
          this.intervalHistory.shift();
        }
      }
    }

    this.timestamps.set(key, now);
    console.debug(`[OpenSuggest] Debounce allowed: ${key}`);
    return true;
  }
}
