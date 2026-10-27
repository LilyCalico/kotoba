import { type Page, expect, test } from "@playwright/test";

import { words } from "../../apps/api/src/prisma/seed/words.js";

const INPUT_LABEL = "Ask a question or guess the word";
/** web が出題済み単語を記録する `localStorage` のキー。`apps/web/lib/game/played-words.ts` と揃える。 */
const PLAYED_WORDS_KEY = "kotoba:played-words";

/** 質問への 5 値の回答の表示。 */
const VERDICT = /^(Yes|No|Hard to say|That's not related|Try a yes-or-no question)$/;

function seedWord(id: string) {
  const word = words.find((candidate) => candidate.id === id);
  if (!word) throw new Error(`${id} が seed にない`);
  return word;
}

const fredagsmys = seedWord("fredagsmys");

/**
 * 出題済みの記録を入れた状態でページを開く。api は記録した単語を出題から除くので、
 * seed のうち `unplayed` 以外を記録すれば、出題を `unplayed` に絞れる。
 * 記録は最初の読み込みでだけ入れ、以降の画面遷移で web が書き足した記録は残す。
 */
async function playWithOnly(page: Page, ...unplayed: string[]) {
  const played = words.map((word) => word.id).filter((id) => !unplayed.includes(id));
  await page.addInitScript(
    ([key, value]) => {
      if (window.sessionStorage.getItem("e2e:played-words-set")) return;
      window.sessionStorage.setItem("e2e:played-words-set", "1");
      window.localStorage.setItem(key, value);
    },
    [PLAYED_WORDS_KEY, JSON.stringify(played)] as const,
  );
}

async function playedWords(page: Page): Promise<string[]> {
  return page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? "[]"), PLAYED_WORDS_KEY);
}

/**
 * ログに積まれたバブル。回答と正誤フィードバックは読み上げのためライブリージョンにも同じ文言が載るので、
 * ライブリージョンの中を除いて探す。
 */
function bubble(page: Page, text: string | RegExp) {
  return page.locator("main p:not([role=status] > p)").filter({ hasText: text });
}

/** 起動画面を Skip で飛ばし、スタート画面の Start a game からゲームを始める。 */
async function startFromHome(page: Page) {
  await page.getByRole("button", { name: "Skip" }).click();
  await page.getByRole("link", { name: "Start a game" }).click();
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
  await expect(page.getByText("Thinking…")).toHaveCount(0);
}

async function giveUp(page: Page) {
  await page.getByRole("banner").getByRole("button", { name: "Give up" }).click();
  const dialog = page.getByRole("dialog", { name: "Give up?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Give up" }).click();
  await expect(dialog).toHaveCount(0);
}

test("起動画面は打ち終えるとスタート画面に移り、同じタブでは 2 回目から出ない", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Skip" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start a game" })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("button", { name: "Skip" })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("link", { name: "Start a game" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Skip" })).toHaveCount(0);
});

test("Skip を押すとスタート画面の見出しへフォーカスが移る", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Skip" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "A word for a feeling you’ve never named" })).toBeFocused();
});

test("START から設問の提示を経て、質問に回答が返る", async ({ page }) => {
  await page.goto("/");
  await startFromHome(page);

  await expect(page).toHaveURL("/play");
  await enterChat(page);
  await send(page, "Is it a noun?");

  await expect(bubble(page, "Is it a noun?")).toBeVisible();
  await expect(bubble(page, VERDICT)).toBeVisible();
});

test("誤答のフィードバックのあと、同じ入力欄から再び解答できる", async ({ page }) => {
  await playWithOnly(page, fredagsmys.id);
  await page.goto("/play");
  await expect(page.getByText(fredagsmys.teaser.en)).toBeVisible();
  await enterChat(page);

  await send(page, "hygge");
  await expect(bubble(page, "Not the word this time.")).toBeVisible();

  await send(page, "fredagsmys");
  await expect(bubble(page, "That's the word!")).toBeVisible();
});

test("ヒントを 3 回開示すると、ヒントボタンが無効になる", async ({ page }) => {
  await playWithOnly(page, fredagsmys.id);
  await page.goto("/play");
  await enterChat(page);

  for (const [offset, text] of fredagsmys.hints.en.entries()) {
    await page.getByRole("button", { name: /^Show a hint/ }).click();
    const hint = page.getByRole("region", { name: `Hint ${offset + 1} of 3` });
    await expect(hint).toBeVisible();
    await expect(hint.getByText(text)).toBeVisible();
  }

  const hint = page.getByRole("button", { name: "Show a hint, 0 left" });
  await expect(hint).toBeVisible();
  await expect(hint).toBeDisabled();
});

test("正解すると結果カードに単語と定義が出て、単語が記録される", async ({ page }) => {
  await playWithOnly(page, fredagsmys.id);
  await page.goto("/play");
  await enterChat(page);

  await send(page, "fredagsmys");

  const result = page.getByRole("region", { name: "You found it" });
  await expect(result).toBeVisible();
  await expect(result.getByText(fredagsmys.word, { exact: true })).toBeVisible();
  await expect(result.getByText(fredagsmys.definition.en)).toBeVisible();
  await expect(input(page)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Play again" })).toBeVisible();
  expect((await playedWords(page)).at(-1)).toBe(fredagsmys.id);
});

test("確認ダイアログを経てギブアップすると、結果カードに単語と定義が出る", async ({ page }) => {
  await playWithOnly(page, fredagsmys.id);
  await page.goto("/play");
  await enterChat(page);

  await giveUp(page);

  const result = page.getByRole("region", { name: "The word was" });
  await expect(result).toBeVisible();
  await expect(result.getByText(fredagsmys.word, { exact: true })).toBeVisible();
  await expect(result.getByText(fredagsmys.definition.en)).toBeVisible();
});

test("答えを見た単語は、次のゲームで出題されない", async ({ page }) => {
  const [first, second] = ["fredagsmys", "fika"].map(seedWord);
  if (!first || !second) throw new Error("seed の単語が足りない");
  await playWithOnly(page, first.id, second.id);
  await page.goto("/play");
  await enterChat(page);

  await giveUp(page);
  const answered = (await playedWords(page)).at(-1);
  const next = answered === first.id ? second : first;

  await page.getByRole("link", { name: "Play again" }).click();
  await startFromHome(page);
  await expect(page.getByText(next.teaser.en)).toBeVisible();
});

test("プールを一巡すると、記録をその単語 1 件に戻す", async ({ page }) => {
  await playWithOnly(page);
  await page.goto("/play");
  await enterChat(page);

  await giveUp(page);

  const played = await playedWords(page);
  expect(played).toHaveLength(1);
  expect(words.map((word) => word.id)).toContain(played[0]);
});

test("正解の送信中にギブアップしても、答えを見た単語を 1 回だけ記録する", async ({ page }) => {
  await playWithOnly(page, fredagsmys.id);
  const before = words.map((word) => word.id).filter((id) => id !== fredagsmys.id);

  // 正解はサーバーで処理させたまま、応答だけをギブアップの応答のあとまで止める。
  let inputProcessed = () => {};
  const processed = new Promise<void>((resolve) => {
    inputProcessed = resolve;
  });
  let releaseInput = () => {};
  const held = new Promise<void>((resolve) => {
    releaseInput = resolve;
  });
  await page.route("**/api/v1/games/*/inputs", async (route) => {
    const response = await route.fetch();
    inputProcessed();
    await held;
    await route.fulfill({ response });
  });

  await page.goto("/play");
  await enterChat(page);
  await input(page).fill(fredagsmys.id);
  await input(page).press("Enter");
  await processed;

  // クリア済みのゲームへのギブアップには、クリアの結果が返し直される。
  await page.getByRole("banner").getByRole("button", { name: "Give up" }).click();
  const giveUpResponse = page.waitForResponse("**/api/v1/games/*/give-up");
  await page.getByRole("dialog", { name: "Give up?" }).getByRole("button", { name: "Give up" }).click();
  await giveUpResponse;
  const inputResponse = page.waitForResponse("**/api/v1/games/*/inputs");
  releaseInput();
  await inputResponse;

  await expect(page.getByRole("region", { name: "You found it" })).toBeVisible();
  await expect.poll(() => playedWords(page)).toEqual([...before, fredagsmys.id]);
});
