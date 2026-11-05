import { describe, expect, it } from "vitest";

import { isLocale, localeOfPath, localizedPath, negotiateLocale, preferredLocale } from "./locale";

describe("negotiateLocale", () => {
  it("主言語のサブタグで UI 言語を選ぶ", () => {
    expect(negotiateLocale("ja-JP,ja;q=0.9,en-US;q=0.8")).toBe("ja");
    expect(negotiateLocale("en-US,en;q=0.9")).toBe("en");
  });

  it("品質値の高いものから見る", () => {
    expect(negotiateLocale("en;q=0.5,ja;q=0.8")).toBe("ja");
  });

  it("UI 言語に当たらないものは飛ばす", () => {
    expect(negotiateLocale("sv-SE,sv;q=0.9,ja;q=0.5")).toBe("ja");
  });

  it("品質値が 0 の言語は選ばない", () => {
    expect(negotiateLocale("ja;q=0,en;q=0.1")).toBe("en");
  });

  it("どれにも当たらない・ヘッダーがないときは英語にする", () => {
    expect(negotiateLocale("sv-SE,de;q=0.8")).toBe("en");
    expect(negotiateLocale(null)).toBe("en");
    expect(negotiateLocale("")).toBe("en");
  });
});

describe("preferredLocale", () => {
  it("画面で切り替えた言語を、ブラウザの言語より先に選ぶ", () => {
    expect(preferredLocale("en", "ja-JP,ja;q=0.9")).toBe("en");
    expect(preferredLocale("ja", "en-US,en;q=0.9")).toBe("ja");
  });

  it("切り替えた言語がない・UI 言語でないときは、ブラウザの言語で選ぶ", () => {
    expect(preferredLocale(undefined, "ja-JP,ja;q=0.9")).toBe("ja");
    expect(preferredLocale("sv", "ja-JP,ja;q=0.9")).toBe("ja");
    expect(preferredLocale(undefined, null)).toBe("en");
  });
});

describe("パスと言語", () => {
  it("先頭のセグメントが UI 言語のときだけ、その言語を返す", () => {
    expect(localeOfPath("/ja")).toBe("ja");
    expect(localeOfPath("/en/play")).toBe("en");
    expect(localeOfPath("/")).toBeUndefined();
    expect(localeOfPath("/play")).toBeUndefined();
    expect(localeOfPath("/japan")).toBeUndefined();
  });

  it("言語のないパスに言語を付ける", () => {
    expect(localizedPath("ja", "/")).toBe("/ja");
    expect(localizedPath("en", "/play")).toBe("/en/play");
  });

  it("UI 言語だけを言語と認める", () => {
    expect(isLocale("ja")).toBe(true);
    expect(isLocale("sv")).toBe(false);
  });
});
