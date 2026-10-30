import { randomInt } from "node:crypto";
import { test as base } from "@playwright/test";

export { expect } from "@playwright/test";
export type { Page } from "@playwright/test";

/**
 * テストごとに違うクライアントの IP を `x-forwarded-for` で名乗らせる `test`。spec はすべてこれを使う。
 *
 * api はゲーム開始と入力をクライアントの IP ごとに数えて制限する（`docs/specifications/api.md`「レートリミット」）。
 * E2E のリクエストはどれも同じ接続元から届くため、そのままでは全テストが 1 つの枠を分け合い、
 * 並列に走るとゲーム開始の上限（1 分に 10 回）を超える。web の rewrite はこのヘッダーを書き換えずに api へ渡す。
 */
export const test = base.extend({
  extraHTTPHeaders: async ({ extraHTTPHeaders }, use) => {
    await use({
      ...extraHTTPHeaders,
      "x-forwarded-for": `198.18.${randomInt(256)}.${randomInt(1, 255)}`,
    });
  },
});
