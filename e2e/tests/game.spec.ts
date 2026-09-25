import { type Locator, type Page, expect, test } from "@playwright/test";

/** モックはプールからランダムに 1 語選ぶ。経路を固定するため単語を指定する。 */
const PLAY_URL = "/play?word=fredagsmys";

const TEASER = "On Friday night, this word lives on the sofa";

/** 確定した回答は読み上げ用の領域にも載る。数と可視性はチャットの中だけで数える。 */
function log(page: Page): Locator {
  return page.locator("#chat-log");
}

async function openChat(page: Page) {
  await page.goto(PLAY_URL);
  await expect(page.getByText(TEASER)).toBeVisible();
  await page.getByRole("button", { name: "Start asking questions" }).click();
}

async function send(page: Page, text: string) {
  await page.getByLabel("Ask a question or make a guess").fill(text);
  await page.getByRole("button", { name: "Send" }).click();
}

test("スタート画面の START からプレイ画面へ進み、設問が提示される", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "START" }).click();

  await expect(page).toHaveURL(/\/play/);
  await expect(page.getByRole("region", { name: "Question" })).toBeVisible();
});

test("質問を送ると回答が返る", async ({ page }) => {
  await openChat(page);

  await send(page, "Is it something you do on a Friday?");

  await expect(log(page).getByText("Yes", { exact: true })).toBeVisible();
});

test("誤答のあとも同じ入力欄から解答し直せる", async ({ page }) => {
  await openChat(page);

  await send(page, "fika");
  await expect(log(page).getByText("Not the word this time.")).toBeVisible();

  await send(page, "mysig");
  await expect(log(page).getByText("Not the word this time.")).toHaveCount(2);
});

test("ヒントを 3 回開示するとボタンが無効になる", async ({ page }) => {
  await openChat(page);

  for (const remaining of [3, 2, 1]) {
    await page.getByRole("button", { name: `Hint (${remaining} left)` }).click();
    await expect(
      page.getByRole("region", { name: `Hint ${4 - remaining} of 3` }),
    ).toBeVisible();
  }

  await expect(
    page.getByRole("button", { name: "Hint (0 left)" }),
  ).toBeDisabled();
});

test("正解を入力すると結果カードが出る", async ({ page }) => {
  await openChat(page);

  await send(page, "fredagsmys");

  await expect(log(page).getByText("That's the word!")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "You found it" }),
  ).toBeVisible();
  await expect(log(page).getByText("Fredagsmys", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Play again" })).toBeVisible();
});

test("ギブアップは確認ダイアログを挟んで結果カードを出す", async ({ page }) => {
  await openChat(page);

  await page.getByRole("button", { name: "Give up" }).click();
  await expect(page.getByRole("heading", { name: "Give up?" })).toBeVisible();

  await page.getByRole("button", { name: "Reveal the word" }).click();

  await expect(
    page.getByRole("heading", { name: "The word was" }),
  ).toBeVisible();
  await expect(log(page).getByText("Fredagsmys", { exact: true })).toBeVisible();
});
