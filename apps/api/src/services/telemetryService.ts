export type CompletionTelemetryEvent = {
  requestId?: string;
  language: string;
  filePath: string;
  latencyMs: number;
  model: string;
  cached: boolean;
  suggestionLength: number;
  suggestionPreview?: string;
};

export type FeedbackEvent = {
  requestId: string;
  language: string;
  filePath: string;
  accepted: boolean;
  suggestionLength: number;
};

type TelemetryConfig = {
  enabled: boolean;
  endpoint?: string;
  anonymousId?: string;
};

export class TelemetryService {
  private config: TelemetryConfig;
  private anonymousId: string;

  constructor(config: TelemetryConfig = { enabled: true }) {
    this.config = config;
    this.anonymousId = config.anonymousId ?? this.generateAnonymousId();
  }

  private generateAnonymousId(): string {
    return crypto.randomUUID();
  }

  recordCompletion(event: CompletionTelemetryEvent): void {
    if (!this.config.enabled) return;

    const payload = {
      type: "completion",
      anonymousId: this.anonymousId,
      timestamp: new Date().toISOString(),
      ...event
    };

    console.info(JSON.stringify(payload));

    if (this.config.endpoint) {
      this.sendToRemote(this.config.endpoint, payload).catch(() => {});
    }
  }

  recordFeedback(event: FeedbackEvent): void {
    if (!this.config.enabled) return;

    const payload = {
      type: "feedback",
      anonymousId: this.anonymousId,
      timestamp: new Date().toISOString(),
      ...event
    };

    console.info(JSON.stringify(payload));

    if (this.config.endpoint) {
      this.sendToRemote(this.config.endpoint, payload).catch(() => {});
    }
  }

  private async sendToRemote(endpoint: string, payload: object): Promise<void> {
    await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
  }
}
