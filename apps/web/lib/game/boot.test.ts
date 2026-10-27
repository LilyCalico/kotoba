import { describe, expect, it } from "vitest";

import { BOOT_SEEN_KEY, type BootStorage, hasSeenBoot, keystrokeDelay, markBootSeen } from "./boot";

function memoryStorage(initial: Record<string, string> = {}): BootStorage & { values: Map<string, string> } {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

const failingStorage: BootStorage = {
  getItem: () => {
    throw new Error("denied");
  },
  setItem: () => {
    throw new Error("denied");
  },
};

describe("keystrokeDelay", () => {
  it("文の区切りのあとは長めに止まる", () => {
    expect(keystrokeDelay("!", 0)).toBe(420);
    expect(keystrokeDelay("\n", 0.9)).toBe(420);
  });

  it("ほかの文字のあとは 70ms から 139ms の間で揺れる", () => {
    expect(keystrokeDelay("j", 0)).toBe(70);
    expect(keystrokeDelay("j", 0.999)).toBe(139);
  });
});

describe("hasSeenBoot / markBootSeen", () => {
  it("記録するまでは見ていない", () => {
    const storage = memoryStorage();
    expect(hasSeenBoot(storage)).toBe(false);

    markBootSeen(storage);
    expect(storage.values.get(BOOT_SEEN_KEY)).toBe("1");
    expect(hasSeenBoot(storage)).toBe(true);
  });

  it("記録先が無いときは見ていないものとして扱い、記録しない", () => {
    expect(hasSeenBoot(null)).toBe(false);
    expect(() => markBootSeen(null)).not.toThrow();
  });

  it("読み書きを拒まれても例外を投げず、見ていないものとして扱う", () => {
    expect(hasSeenBoot(failingStorage)).toBe(false);
    expect(() => markBootSeen(failingStorage)).not.toThrow();
  });
});
