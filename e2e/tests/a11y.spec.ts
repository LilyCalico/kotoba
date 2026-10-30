import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "./fixtures.js";

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
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Skip" })).toBeVisible();
  await expectNoViolations(page);

  await page.getByRole("button", { name: "Skip" }).click();
  await expect(page.getByRole("link", { name: "Start a game" })).toBeVisible();
  await expectNoViolations(page);
});

test("設問の提示に axe の違反がない", async ({ page }) => {
  await page.goto("/play");
  await expect(page.getByRole("region", { name: "Question" })).toBeVisible();

  await expectNoViolations(page);
});

test("プレイ中・ギブアップの確認・結果に axe の違反がない", async ({ page }) => {
  await page.goto("/play");
  await expect(page.getByRole("region", { name: "Question" })).toBeVisible();
  await page.keyboard.press("Enter");

  const input = page.getByRole("textbox", { name: "Ask a question or guess the word" });
  await input.fill("Is it a feeling?");
  await input.press("Enter");
  await expect(page.getByText("Thinking…")).toHaveCount(0);
  await input.fill("hygge");
  await input.press("Enter");
  await expect(page.getByText("Thinking…")).toHaveCount(0);
  await page.getByRole("button", { name: /^Show a hint/ }).click();
  await expect(page.getByRole("region", { name: "Hint 1 of 3" })).toBeVisible();
  await expectNoViolations(page);

  await page.getByRole("banner").getByRole("button", { name: "Give up" }).click();
  const dialog = page.getByRole("dialog", { name: "Give up?" });
  await expect(dialog).toBeVisible();
  // モーダルの外は操作できず、暗い覆いの下にある。覆いの下の文字のコントラストは問わず、ダイアログの中だけを見る。
  await expectNoViolations(page, '[role="dialog"]');

  await dialog.getByRole("button", { name: "Give up" }).click();
  // 閉じる途中の覆いが残っていると、その下の文字のコントラストを測ってしまうため、消えきるのを待つ。
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("region", { name: "The word was" })).toBeVisible();
  await expectNoViolations(page);
});
