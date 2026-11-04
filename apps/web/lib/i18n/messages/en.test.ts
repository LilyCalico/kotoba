import { describe, expect, it } from "vitest";

import { en } from "./en";

describe("待つ時間の言い回し", () => {
  const wait = en.error.rateLimit;

  it("1 時間未満は分に切り上げる", () => {
    expect(wait(1)).toBe("You're sending too fast. Please try again in about a minute.");
    expect(wait(60)).toContain("in about a minute.");
    expect(wait(61)).toContain("in about 2 minutes.");
    expect(wait(59 * 60)).toContain("in about 59 minutes.");
  });

  it("1 時間以上は時間に丸める", () => {
    expect(wait(60 * 60)).toContain("in about an hour.");
    expect(wait(89 * 60)).toContain("in about an hour.");
    expect(wait(90 * 60)).toContain("in about 2 hours.");
  });

  it("秒数がなければ時間を言わない", () => {
    expect(wait(undefined)).toContain("in a little while.");
  });

  it("ゲーム開始と AI の上限の案内も同じ言い回しで組む", () => {
    expect(en.play.startLimit(45)).toBe("Too many new games. Try again in about a minute.");
    expect(en.error.aiLimit(37)).toBe("The free AI plan hit its limit. Please try again in about a minute.");
  });
});
