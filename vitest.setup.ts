import { afterEach } from "vitest";

const NATIVE_FETCH = globalThis.fetch;

afterEach(() => {
  if (NATIVE_FETCH) {
    globalThis.fetch = NATIVE_FETCH;
    return;
  }

  delete (globalThis as { fetch?: unknown }).fetch;
});
