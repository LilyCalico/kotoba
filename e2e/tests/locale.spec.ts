import { expect, test } from "./fixtures.js";

import { en } from "../../apps/web/lib/i18n/messages/en.js";

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

test("スタート画面からは、同じ言語のプレイ画面へ進む", async ({ page }) => {
  await page.goto("/ja");
  await page.getByRole("button", { name: en.start.skip }).click();
  await page.getByRole("link", { name: en.start.startGame }).click();

  await expect(page).toHaveURL("/ja/play");
});

test("対応していない言語のセグメントは 404 になる", async ({ page }) => {
  const response = await page.goto("/en/fr");

  expect(response?.status()).toBe(404);
});
