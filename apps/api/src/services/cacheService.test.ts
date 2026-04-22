import { describe, expect, it, vi } from "vitest";
import { CacheService } from "./cacheService.js";

describe("CacheService", () => {
  it("returns cached value before expiry", () => {
    vi.useFakeTimers();
    const cache = new CacheService<string>(1000);

    cache.set("key", "value");

    expect(cache.get("key")).toBe("value");
    vi.useRealTimers();
  });

  it("expires value after ttl", () => {
    vi.useFakeTimers();
    const cache = new CacheService<string>(1000);

    cache.set("key", "value");
    vi.advanceTimersByTime(1001);

    expect(cache.get("key")).toBeUndefined();
    vi.useRealTimers();
  });
});
