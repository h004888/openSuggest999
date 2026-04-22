import { beforeEach, describe, expect, it, vi } from "vitest";
import { DebounceGate } from "./debounce";

describe("DebounceGate", () => {
  let gate: DebounceGate;

  beforeEach(() => {
    vi.restoreAllMocks();
    gate = new DebounceGate(200);
  });

  describe("allow", () => {
    it("allows first call for a key", () => {
      const result = gate.allow("doc-1", 1000);
      expect(result).toBe(true);
    });

    it("blocks repeated calls within debounce window", () => {
      gate.allow("doc-1", 1000);
      const blocked = gate.allow("doc-1", 1100);
      expect(blocked).toBe(false);
    });

    it("allows calls for different keys", () => {
      gate.allow("doc-a", 1000);
      const result = gate.allow("doc-b", 1000);
      expect(result).toBe(true);
    });

    it("allows repeated calls after window expires", () => {
      gate.allow("doc-1", 1000);
      const result = gate.allow("doc-1", 1401);
      expect(result).toBe(true);
    });

    it("reduces effective debounce for high-signal contexts", () => {
      gate.allow("doc-1", 1000);
      const allowed = gate.allow("doc-1", {
        triggerCharacter: ".",
        isLineEnd: true,
        isDocumentEnd: true,
        manuallyTriggered: false
      });
      expect(allowed).toBe(true);
    });

    it("bypasses adaptive scoring for manual trigger", () => {
      gate.allow("doc-1", 1000);
      const allowed = gate.allow("doc-1", {
        triggerCharacter: ".",
        isLineEnd: true,
        isDocumentEnd: true,
        manuallyTriggered: true
      });
      expect(allowed).toBe(true);
    });
  });

  describe("updateDebounceMs", () => {
    it("updates debounce timing", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      gate.updateDebounceMs(500);
      expect(consoleSpy).toHaveBeenCalledWith("[OpenSuggest] Debounce updated: 500ms");
    });
  });

  describe("updateConfig", () => {
    it("applies new debounce config", () => {
      gate.updateConfig({
        baseInterval: 300,
        minInterval: 50,
        maxInterval: 500
      });

      gate.allow("doc-1", 1000);
      const blocked = gate.allow("doc-1", 1049);
      expect(blocked).toBe(false);
    });
  });
});
