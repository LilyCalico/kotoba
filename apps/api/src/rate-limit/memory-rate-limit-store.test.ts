import { describe, expect, it } from "vitest";
import { MemoryRateLimitStore } from "./memory-rate-limit-store.js";
import { RATE_LIMIT_WINDOW_MS } from "./rate-limit-store.js";

describe("MemoryRateLimitStore", () => {
  it("同じ key と窓の回数を数え、key ごとに分ける", async () => {
    const store = new MemoryRateLimitStore();

    expect(await store.hit("input:a", 0)).toBe(1);
    expect(await store.hit("input:a", 0)).toBe(2);
    expect(await store.hit("input:b", 0)).toBe(1);
    expect(await store.hit("start:a", 0)).toBe(1);
  });

  it("次の窓では 1 から数え直す", async () => {
    const store = new MemoryRateLimitStore();
    await store.hit("input:a", 0);
    await store.hit("input:a", 0);

    expect(await store.hit("input:a", RATE_LIMIT_WINDOW_MS)).toBe(1);
  });
});
