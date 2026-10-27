import { Logger, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  GeminiInputJudge,
  UnavailableInputJudge,
  createGenerateContent,
} from "./gemini-input-judge.js";
import { INPUT_JUDGE, type InputJudge } from "./input-judge.js";

/** `GEMINI_MODEL` を指定しないときのモデル。分類と 5 値の回答には Flash-Lite で足りる。 */
export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";

/**
 * 環境変数から `InputJudge` を組み立てる。
 * `GEMINI_API_KEY` がなくても起動を止めず、警告を出して `ai_unavailable` を返す実装にする。
 * 簡易な判定で代用しないのは、キーの設定漏れが静かに誤った回答として出るのを避けるためである。
 */
export function createInputJudge(config: ConfigService): InputJudge {
  const apiKey = config.get<string>("GEMINI_API_KEY");
  if (!apiKey) {
    new Logger("JudgeModule").warn(
      "GEMINI_API_KEY が未設定のため、AI が要る入力は ai_unavailable を返す",
    );
    return new UnavailableInputJudge();
  }

  const generate = createGenerateContent({
    apiKey,
    baseUrl: config.get<string>("GEMINI_BASE_URL"),
  });
  return new GeminiInputJudge(generate, {
    model: config.get<string>("GEMINI_MODEL") || DEFAULT_GEMINI_MODEL,
  });
}

@Module({
  providers: [{ provide: INPUT_JUDGE, useFactory: createInputJudge, inject: [ConfigService] }],
  exports: [INPUT_JUDGE],
})
export class JudgeModule {}
