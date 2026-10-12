import { type Page, expect, test } from "@playwright/test";

const INPUT_LABEL = "Ask a question or guess the word";
const FIXED_WORD = "/play?word=fredagsmys";
const TEASER = "On Friday night, this word lives on the sofa";
const WORD = "Fredagsmys";
const DEFINITION =
  "The habit of settling onto the sofa with family or a partner on a Friday night, snacks at hand.";

/** 質問への 5 値の回答の表示。 */
const VERDICT = /^(Yes|No|Hard to say|That's not related|Try a yes-or-no question)$/;

/**
 * ログに積まれたバブル。回答と正誤フィードバックは読み上げのためライブリージョンにも同じ文言が載るので、
 * ライブリージョンの中を除いて探す。
 */
function bubble(page: Page, text: string | RegExp) {
  return page.locator("main p:not([role=status] > p)").filter({ hasText: text });
}

function input(page: Page) {
  return page.getByRole("textbox", { name: INPUT_LABEL });
}

/**
 * 設問の提示をクリックで進め、3 秒の自動遷移を待たずにチャットへ移る。
 * 画面の中央はチャットに移ってもログの空き領域なので、自動遷移とクリックが重なっても操作には当たらない。
 */
async function enterChat(page: Page) {
  await expect(page.getByRole("region", { name: "Question" })).toBeVisible();
  await page.locator("main").click();
  await expect(input(page)).toBeVisible();
}

/** 入力欄から送信し、応答が届いて入力欄が再び使えるようになるまで待つ。 */
async function send(page: Page, text: string) {
  await expect(input(page)).toBeEnabled();
  await input(page).fill(text);
  await input(page).press("Enter");
  await expect(page.getByText("Waiting for an answer")).toHaveCount(0);
}

test("START から設問の提示を経て、質問に回答が返る", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "START" }).click();

  await expect(page).toHaveURL("/play");
  await enterChat(page);
  await send(page, "Is it a noun?");

  await expect(bubble(page, "Is it a noun?")).toBeVisible();
  await expect(bubble(page, VERDICT)).toBeVisible();
});

test("誤答のフィードバックのあと、同じ入力欄から再び解答できる", async ({ page }) => {
  await page.goto(FIXED_WORD);
  await expect(page.getByText(TEASER)).toBeVisible();
  await enterChat(page);

  await send(page, "hygge");
  await expect(bubble(page, "Not the word this time.")).toBeVisible();

  await send(page, "fredagsmys");
  await expect(bubble(page, "That's the word!")).toBeVisible();
});

test("ヒントを 3 回開示すると、ヒントボタンが無効になる", async ({ page }) => {
  await page.goto(FIXED_WORD);
  await enterChat(page);

  for (const index of [1, 2, 3]) {
    await page.getByRole("button", { name: /^Hint/ }).click();
    await expect(page.getByRole("region", { name: `Hint ${index} of 3` })).toBeVisible();
  }

  const hint = page.getByRole("button", { name: "Hint (0 left)" });
  await expect(hint).toBeVisible();
  await expect(hint).toBeDisabled();
});

test("正解すると結果カードに単語と定義が出る", async ({ page }) => {
  await page.goto(FIXED_WORD);
  await enterChat(page);

  await send(page, "fredagsmys");

  const result = page.getByRole("region", { name: "You found it" });
  await expect(result).toBeVisible();
  await expect(result.getByText(WORD)).toBeVisible();
  await expect(result.getByText(DEFINITION)).toBeVisible();
  await expect(input(page)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Play again" })).toBeVisible();
});

test("確認ダイアログを経てギブアップすると、結果カードに単語と定義が出る", async ({ page }) => {
  await page.goto(FIXED_WORD);
  await enterChat(page);

  await page.getByRole("banner").getByRole("button", { name: "Give up" }).click();
  const dialog = page.getByRole("dialog", { name: "Give up?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Give up" }).click();

  await expect(dialog).toHaveCount(0);
  const result = page.getByRole("region", { name: "The word was" });
  await expect(result).toBeVisible();
  await expect(result.getByText(WORD)).toBeVisible();
  await expect(result.getByText(DEFINITION)).toBeVisible();
});
