import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "./fixtures.js";

import { en } from "../../apps/web/lib/i18n/messages/en.js";

/** ヒントボタン。名前の後ろに残りの回数が付くため、前方一致で探す。 */
const HINT_BUTTON = new RegExp(`^${en.hint.button}`);

/** 検証する WCAG の達成基準。2.2 の AA までを対象にする。 */
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** `include` を渡すと、その要素の中だけを検証する。 */
async function expectNoViolations(page: Page, include?: string) {
  // 出現の動きは不透明度を 0 から上げるため、動いている途中だとコントラストを低く測る。止まりきるのを待つ。
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every((animation) => animation.playState !== "running" || animation.effect?.getTiming().iterations === Infinity),
  );
  // React Aria が読み上げのために <body> 直下に置く要素（ボタンの処理中の通知など）は、画面の内容ではないため外す。
  const builder = new AxeBuilder({ page }).withTags(WCAG_TAGS).exclude("[data-live-announcer]");
  const { violations } = await (include ? builder.include(include) : builder).analyze();
  expect(violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) }))).toEqual([]);
}

test("起動画面とスタート画面に axe の違反がない", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("button", { name: en.start.skip })).toBeVisible();
  await expectNoViolations(page);

  await page.getByRole("button", { name: en.start.skip }).click();
  await expect(page.getByRole("link", { name: en.start.startGame })).toBeVisible();
  await expectNoViolations(page);
});

test("設問の提示に axe の違反がない", async ({ page }) => {
  await page.goto("/en/play");
  await expect(page.getByRole("region", { name: en.teaser.title })).toBeVisible();

  await expectNoViolations(page);
});

test("プレイ中・ギブアップの確認・結果に axe の違反がない", async ({ page }) => {
  await page.goto("/en/play");
  await expect(page.getByRole("region", { name: en.teaser.title })).toBeVisible();
  await page.keyboard.press("Enter");

  const input = page.getByRole("textbox", { name: en.input.label });
  await input.fill("Is it a feeling?");
  await input.press("Enter");
  await expect(page.getByText(en.pending.title)).toHaveCount(0);
  await input.fill("hygge");
  await input.press("Enter");
  await expect(page.getByText(en.pending.title)).toHaveCount(0);
  await page.getByRole("button", { name: HINT_BUTTON }).click();
  await expect(page.getByRole("region", { name: en.hint.title(1, 3) })).toBeVisible();
  await expectNoViolations(page);

  await page.getByRole("banner").getByRole("button", { name: en.header.giveUp }).click();
  const dialog = page.getByRole("dialog", { name: en.giveUpDialog.title });
  await expect(dialog).toBeVisible();
  // モーダルの外は操作できず、暗い覆いの下にある。覆いの下の文字のコントラストは問わず、ダイアログの中だけを見る。
  await expectNoViolations(page, '[role="dialog"]');

  await dialog.getByRole("button", { name: en.header.giveUp }).click();
  // 閉じる途中の覆いが残っていると、その下の文字のコントラストを測ってしまうため、消えきるのを待つ。
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("region", { name: en.result.heading.gave_up })).toBeVisible();
  await expectNoViolations(page);
});
