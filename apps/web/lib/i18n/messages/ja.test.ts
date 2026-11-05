import { describe, expect, it } from "vitest";

import { ja } from "./ja";

describe("待つ時間の言い回し", () => {
  const wait = ja.error.rateLimit;

  it("1 時間未満は分に切り上げ、文の頭に置く", () => {
    expect(wait(1)).toBe("ちょっと送るのが速すぎるみたい。1 分くらいしたら、もう一度送ってみて。");
    expect(wait(60)).toContain("1 分くらいしたら、");
    expect(wait(61)).toContain("2 分くらいしたら、");
    expect(wait(59 * 60)).toContain("59 分くらいしたら、");
  });

  it("1 時間以上は時間に丸める", () => {
    expect(wait(60 * 60)).toContain("1 時間くらいしたら、");
    expect(wait(89 * 60)).toContain("1 時間くらいしたら、");
    expect(wait(90 * 60)).toContain("2 時間くらいしたら、");
  });

  it("秒数がなければ時間を言わない", () => {
    expect(wait(undefined)).toContain("少ししたら、");
  });

  it("ゲーム開始と AI の上限の案内も同じ言い回しで組む", () => {
    expect(ja.play.startLimit(45)).toBe("新しいゲームが続きすぎたみたい。1 分くらいしたら、もう一度試してね。");
    expect(ja.error.aiLimit(37)).toBe("無料の AI の上限に届いちゃった。1 分くらいしたら、もう一度送ってみて。");
  });
});
