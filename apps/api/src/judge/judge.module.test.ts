import { ConfigService } from "@nestjs/config";
import { describe, expect, it } from "vitest";
import { GeminiInputJudge, UnavailableInputJudge } from "./gemini-input-judge.js";
import { createInputJudge } from "./judge.module.js";

describe("createInputJudge", () => {
  it("GEMINI_API_KEY がなければ、ai_unavailable を返す実装にする", () => {
    expect(createInputJudge(new ConfigService({}))).toBeInstanceOf(UnavailableInputJudge);
    expect(createInputJudge(new ConfigService({ GEMINI_API_KEY: "" }))).toBeInstanceOf(
      UnavailableInputJudge,
    );
  });

  it("GEMINI_API_KEY があれば、Gemini で判定する実装にする", () => {
    expect(createInputJudge(new ConfigService({ GEMINI_API_KEY: "key" }))).toBeInstanceOf(
      GeminiInputJudge,
    );
  });
});
