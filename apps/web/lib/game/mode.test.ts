import { startGameRequestSchema } from "@kotoba/shared";
import { describe, expect, it } from "vitest";

import { gameModeFor } from "./mode";

describe("gameModeFor", () => {
  it("日本語は意味当て、英語は単語当てで遊ぶ", () => {
    expect(gameModeFor("ja")).toBe("guess_meaning");
    expect(gameModeFor("en")).toBe("guess_word");
  });

  it("どの UI 言語の組も api が受け付ける", () => {
    for (const locale of ["ja", "en"] as const) {
      const request = { language: "sv", locale, mode: gameModeFor(locale) };
      expect(startGameRequestSchema.safeParse(request).success, locale).toBe(true);
    }
  });
});
