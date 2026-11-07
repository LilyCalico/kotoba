import { type Page, expect, test } from "./fixtures.js";

import { en } from "../../apps/web/lib/i18n/messages/en.js";
import { ja } from "../../apps/web/lib/i18n/messages/ja.js";

/** スタート画面のヘッダーにある、`locale` の言語への切り替えのリンク。 */
function languageLink(page: Page, locale: "ja" | "en") {
  return page.getByRole("banner").locator(`a[hreflang="${locale}"]`);
}

test.describe("ブラウザの言語が日本語", () => {
  test.use({ locale: "ja-JP" });

  test("言語のない URL は /ja に振り分けられる", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL("/ja");
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  });

  test("パスとクエリを保ったまま振り分けられる", async ({ page }) => {
    await page.goto("/play?from=share");

    await expect(page).toHaveURL("/ja/play?from=share");
  });
});

test.describe("ブラウザの言語が日本語でも英語でもない", () => {
  test.use({ locale: "sv-SE" });

  test("言語のない URL は /en に振り分けられる", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL("/en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});

test.describe("言語の切り替え", () => {
  test.use({ locale: "ja-JP" });

  test("起動画面から、もう一方の言語のスタート画面へ移る", async ({ page }) => {
    await page.goto("/ja");
    await languageLink(page, "en").click();

    await expect(page).toHaveURL("/en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("link", { name: en.start.startGame })).toBeVisible();

    await languageLink(page, "ja").click();

    await expect(page).toHaveURL("/ja");
    await expect(page.getByRole("link", { name: ja.start.startGame })).toBeVisible();
  });

  test("切り替えた言語を覚え、言語のない URL をブラウザの言語より先にその言語へ振り分ける", async ({ page }) => {
    await page.goto("/ja");
    await languageLink(page, "en").click();
    await expect(page).toHaveURL("/en");

    await page.goto("/play");

    await expect(page).toHaveURL("/en/play");
  });

  test("言語の付いた URL を開いただけでは、言語を覚えない", async ({ page }) => {
    await page.goto("/en");

    await page.goto("/");

    await expect(page).toHaveURL("/ja");
  });
});

test("スタート画面からは、同じ言語のプレイ画面へ進む", async ({ page }) => {
  await page.goto("/ja");
  await page.getByRole("button", { name: ja.start.skip }).click();
  await page.getByRole("link", { name: ja.start.startGame }).click();

  await expect(page).toHaveURL("/ja/play");
});

test("対応していない言語のセグメントは 404 になる", async ({ page }) => {
  const response = await page.goto("/en/fr");

  expect(response?.status()).toBe(404);
});
