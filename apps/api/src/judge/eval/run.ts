/**
 * AI の判定の eval を、実際の Gemini を呼んで流す。`pnpm eval` で実行する。
 *
 * - `GEMINI_API_KEY` が要る。`GEMINI_MODEL` を指定すると、そのモデルで流す
 * - 無料枠の 1 分あたりの上限に当たらないよう、呼び出しの間を `EVAL_INTERVAL_MS`（既定 6.5 秒）あける
 * - `--category rescue,injection` のように種類を絞れる
 * - ケースごとの成否と種類ごとの正答率を出し、どれかの種類が基準に届かなければ終了コード 1 で終わる
 */
import { appendFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import { parseArgs } from "node:util";
import { ApiError } from "../../common/api-error.js";
import { words } from "../../prisma/seed/words.js";
import { GeminiInputJudge, createGenerateContent } from "../gemini-input-judge.js";
import type { InputJudge, Judgement } from "../input-judge.js";
import { DEFAULT_GEMINI_MODEL } from "../judge.module.js";
import { EVAL_CASES, type EvalCase, type EvalCategory } from "./cases.js";
import {
  type CaseResult,
  describeExpectation,
  describeJudgement,
  satisfies,
  summarize,
  toMarkdown,
} from "./score.js";

/** 無料枠の上限で断られたとき、待って続ける最長の時間。これより長い（1 日あたりの上限）ときは打ち切る。 */
const MAX_QUOTA_WAIT_SECONDS = 120;

/** 1 件のケースで、上限で断られて待ち直す回数の上限。 */
const MAX_QUOTA_RETRIES = 3;

class QuotaExhaustedError extends Error {}

/**
 * 1 件を判定する。無料枠の 1 分あたりの上限で断られたら、戻るまで待って同じケースを送り直す。
 * 判定に失敗したケース（`ai_unavailable`）は、外れとして数える。
 */
async function judgeCase(judge: InputJudge, testCase: EvalCase): Promise<CaseResult> {
  const word = words.find(({ id }) => id === testCase.wordId);
  if (!word) throw new Error(`${testCase.wordId} が seed にない`);

  for (let attempt = 0; ; attempt++) {
    let judgement: Judgement;
    try {
      judgement = await judge.judge({
        mode: "guess_word",
        word,
        history: testCase.history ?? [],
        text: testCase.input,
      });
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      const wait = error.retryAfterSeconds;
      if (error.code === "ai_rate_limited" && wait !== undefined) {
        if (wait > MAX_QUOTA_WAIT_SECONDS || attempt >= MAX_QUOTA_RETRIES) {
          throw new QuotaExhaustedError(`Gemini の無料枠の上限に達した（戻るまで ${wait} 秒）`);
        }
        console.log(`  … 無料枠の上限。${wait} 秒待って送り直す`);
        await sleep(wait * 1000);
        continue;
      }
      return { ...testCase, error: error.code, passed: false };
    }
    return { ...testCase, judgement, passed: satisfies(judgement, testCase.expect) };
  }
}

function printResult(result: CaseResult): void {
  const mark = result.passed ? "✓" : "✗";
  const line = `${mark} [${result.category}] ${result.wordId} ${JSON.stringify(result.input)} → ${describeJudgement(result)}`;
  console.log(result.passed ? line : `${line}（期待: ${describeExpectation(result.expect)}）`);
}

async function main(): Promise<number> {
  const { values } = parseArgs({ options: { category: { type: "string" } } });
  const categories = values.category?.split(",").map((category) => category.trim()) as EvalCategory[] | undefined;
  const cases = EVAL_CASES.filter(({ category }) => !categories || categories.includes(category));

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY が未設定。apps/api/.env か環境変数で渡す");
    return 1;
  }
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const interval = Number(process.env.EVAL_INTERVAL_MS ?? 6500);
  const judge = new GeminiInputJudge(createGenerateContent({ apiKey }), { model });

  console.log(`${model} で ${cases.length} 件を判定する（間隔 ${interval / 1000} 秒）`);
  const results: CaseResult[] = [];
  try {
    for (const [index, testCase] of cases.entries()) {
      if (index > 0) await sleep(interval);
      const result = await judgeCase(judge, testCase);
      results.push(result);
      printResult(result);
    }
  } catch (error) {
    if (!(error instanceof QuotaExhaustedError)) throw error;
    console.error(`\n${error.message}。${results.length} / ${cases.length} 件で打ち切った`);
    return 1;
  }

  const summaries = summarize(results);
  console.log("");
  for (const { category, passed, total, required, ok } of summaries) {
    const rate = Math.round((passed / total) * 100);
    console.log(`${ok ? "✓" : "✗"} ${category}: ${passed} / ${total}（${rate}%、基準 ${required * 100}%）`);
  }

  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) await appendFile(summaryFile, toMarkdown(results, model));

  return summaries.every(({ ok }) => ok) ? 0 : 1;
}

process.exitCode = await main();
