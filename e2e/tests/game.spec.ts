import { type Page, expect, test } from "./fixtures.js";

import { words } from "../../apps/api/src/prisma/seed/words.js";
import { en } from "../../apps/web/lib/i18n/messages/en.js";
import { ja } from "../../apps/web/lib/i18n/messages/ja.js";
import { type Locale, dictionaries, modeOf, openingTitle } from "./locales.js";

/** web が出題済み単語を記録する `localStorage` のキー。`apps/web/lib/game/played-words.ts` と揃える。 */
const PLAYED_WORDS_KEY = "kotoba:played-words";

/** 質問への 5 値の回答の表示。 */
const VERDICT = new RegExp(`^(${Object.values(en.verdict).join("|")})$`);

/** ヒントボタン。名前の後ろに残りの回数が付くため、前方一致で探す。 */
const HINT_BUTTON = new RegExp(`^${en.hint.button}`);

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
async function startFromHome(page: Page, locale: Locale = "en") {
  const t = dictionaries[locale];
  await page.getByRole("button", { name: t.start.skip }).click();
  await page.getByRole("link", { name: t.start.startGame }).click();
}

function input(page: Page, locale: Locale = "en") {
  return page.getByRole("textbox", { name: dictionaries[locale].input.label[modeOf(locale)] });
}

/**
 * 最初に見せるカードの提示をクリックで進め、3 秒の自動遷移を待たずにチャットへ移る。
 * 画面の中央はチャットに移ってもログの空き領域なので、自動遷移とクリックが重なっても操作には当たらない。
 */
async function enterChat(page: Page, locale: Locale = "en") {
  await expect(page.getByRole("region", { name: openingTitle(locale) })).toBeVisible();
  await page.locator("main").click();
  await expect(input(page, locale)).toBeVisible();
}

/** 入力欄から送信し、応答が届いて入力欄が再び使えるようになるまで待つ。 */
async function send(page: Page, text: string, locale: Locale = "en") {
  await expect(input(page, locale)).toBeEnabled();
  await input(page, locale).fill(text);
  await input(page, locale).press("Enter");
  await expect(page.getByText(dictionaries[locale].pending.title)).toHaveCount(0);
}

async function giveUp(page: Page) {
  await page.getByRole("banner").getByRole("button", { name: en.header.giveUp }).click();
  const dialog = page.getByRole("dialog", { name: en.giveUpDialog.title });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: en.header.giveUp }).click();
  await expect(dialog).toHaveCount(0);
}

test("起動画面は打ち終えるとスタート画面に移り、同じタブでは 2 回目から出ない", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("button", { name: en.start.skip })).toBeVisible();
  await expect(page.getByRole("link", { name: en.start.startGame })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("button", { name: en.start.skip })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("link", { name: en.start.startGame })).toBeVisible();
  await expect(page.getByRole("button", { name: en.start.skip })).toHaveCount(0);
});

test("Skip を押すとスタート画面の見出しへフォーカスが移る", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("button", { name: en.start.skip }).click();

  await expect(page.getByRole("heading", { level: 1, name: en.start.heading[modeOf("en")] })).toBeFocused();
});

test("START から設問の提示を経て、質問に回答が返る", async ({ page }) => {
  await page.goto("/en");
  await startFromHome(page);

  await expect(page).toHaveURL("/en/play");
  await enterChat(page);
  await send(page, "Is it a noun?");

  await expect(bubble(page, "Is it a noun?")).toBeVisible();
  await expect(bubble(page, VERDICT)).toBeVisible();
});

test("対応外の言語で送ると、対応言語で聞き直すよう案内する", async ({ page }) => {
  await page.goto("/en/play");
  await enterChat(page);

  await send(page, "Это еда?");

  await expect(bubble(page, en.unsupportedLanguage)).toBeVisible();
  await expect(input(page)).toBeEnabled();
});

test("/ja では単語と読みを見て、質問・ヒント・意味の解答で遊べ、結果カードに読みが出る", async ({ page }) => {
  await playWithOnly(page, fredagsmys.id);
  await page.goto("/ja");
  await startFromHome(page, "ja");

  await expect(page).toHaveURL("/ja/play");
  const card = page.getByRole("region", { name: ja.wordCard.title });
  await expect(card.getByText(fredagsmys.word, { exact: true })).toBeVisible();
  await expect(card.getByText(fredagsmys.reading, { exact: true })).toBeVisible();
  await expect(page.getByText(fredagsmys.teaser.ja)).toHaveCount(0);
  await enterChat(page, "ja");

  await send(page, "名詞？", "ja");
  await expect(bubble(page, new RegExp(`^${ja.verdict.yes}$`))).toBeVisible();

  await page.getByRole("button", { name: new RegExp(`^${ja.hint.button}`) }).click();
  const hint = page.getByRole("region", { name: ja.hint.title(1, fredagsmys.meaning.hints.length) });
  await expect(hint.getByText(fredagsmys.meaning.hints[0] ?? "")).toBeVisible();

  // 意味当てでは、見えている単語の綴りを送っても正解にならない。
  await send(page, fredagsmys.word, "ja");
  await expect(bubble(page, ja.answerFeedback.incorrect[modeOf("ja")])).toBeVisible();

  // E2E の Gemini のスタブは、判定基準の正解の例と同じ入力を正解にする。
  await send(page, fredagsmys.meaning.accepts[0] ?? "", "ja");
  await expect(bubble(page, ja.answerFeedback.correct[modeOf("ja")])).toBeVisible();
  const result = page.getByRole("region", { name: ja.result.heading.cleared[modeOf("ja")] });
  await expect(result.getByText(fredagsmys.word, { exact: true })).toBeVisible();
  await expect(result.getByText(fredagsmys.reading, { exact: true })).toBeVisible();
  await expect(result.getByText(fredagsmys.definition.ja)).toBeVisible();
  await expect(page.getByRole("link", { name: ja.play.playAgain })).toHaveAttribute("href", "/ja");
});

test("誤答のフィードバックのあと、同じ入力欄から再び解答できる", async ({ page }) => {
  await playWithOnly(page, fredagsmys.id);
  await page.goto("/en/play");
  await expect(page.getByText(fredagsmys.teaser.en)).toBeVisible();
  await enterChat(page);

  await send(page, "hygge");
  await expect(bubble(page, en.answerFeedback.incorrect[modeOf("en")])).toBeVisible();

  await send(page, "fredagsmys");
  await expect(bubble(page, en.answerFeedback.correct[modeOf("en")])).toBeVisible();
});

test("ヒントを 3 回開示すると、ヒントボタンが無効になる", async ({ page }) => {
  await playWithOnly(page, fredagsmys.id);
  await page.goto("/en/play");
  await enterChat(page);

  for (const [offset, text] of fredagsmys.hints.en.entries()) {
    await page.getByRole("button", { name: HINT_BUTTON }).click();
    const hint = page.getByRole("region", { name: en.hint.title(offset + 1, fredagsmys.hints.en.length) });
    await expect(hint).toBeVisible();
    await expect(hint.getByText(text)).toBeVisible();
  }

  const hint = page.getByRole("button", { name: en.hint.buttonLabel(0) });
  await expect(hint).toBeVisible();
  await expect(hint).toBeDisabled();
});

test("正解すると結果カードに単語と定義が出て、単語が記録される", async ({ page }) => {
  await playWithOnly(page, fredagsmys.id);
  await page.goto("/en/play");
  await enterChat(page);

  await send(page, "fredagsmys");

  const result = page.getByRole("region", { name: en.result.heading.cleared[modeOf("en")] });
  await expect(result).toBeVisible();
  await expect(result.getByText(fredagsmys.word, { exact: true })).toBeVisible();
  await expect(result.getByText(fredagsmys.definition.en)).toBeVisible();
  await expect(input(page)).toHaveCount(0);
  await expect(page.getByRole("link", { name: en.play.playAgain })).toBeVisible();
  expect((await playedWords(page)).at(-1)).toBe(fredagsmys.id);
});

test("確認ダイアログを経てギブアップすると、結果カードに単語と定義が出る", async ({ page }) => {
  await playWithOnly(page, fredagsmys.id);
  await page.goto("/en/play");
  await enterChat(page);

  await giveUp(page);

  const result = page.getByRole("region", { name: en.result.heading.gave_up[modeOf("en")] });
  await expect(result).toBeVisible();
  await expect(result.getByText(fredagsmys.word, { exact: true })).toBeVisible();
  await expect(result.getByText(fredagsmys.definition.en)).toBeVisible();
});

test("答えを見た単語は、次のゲームで出題されない", async ({ page }) => {
  const [first, second] = ["fredagsmys", "fika"].map(seedWord);
  if (!first || !second) throw new Error("seed の単語が足りない");
  await playWithOnly(page, first.id, second.id);
  await page.goto("/en/play");
  await enterChat(page);

  await giveUp(page);
  const answered = (await playedWords(page)).at(-1);
  const next = answered === first.id ? second : first;

  await page.getByRole("link", { name: en.play.playAgain }).click();
  await startFromHome(page);
  await expect(page.getByText(next.teaser.en)).toBeVisible();
});

test("プールを一巡すると、記録をその単語 1 件に戻す", async ({ page }) => {
  await playWithOnly(page);
  await page.goto("/en/play");
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

  await page.goto("/en/play");
  await enterChat(page);
  await input(page).fill(fredagsmys.id);
  await input(page).press("Enter");
  await processed;

  // クリア済みのゲームへのギブアップには、クリアの結果が返し直される。
  await page.getByRole("banner").getByRole("button", { name: en.header.giveUp }).click();
  const giveUpResponse = page.waitForResponse("**/api/v1/games/*/give-up");
  await page.getByRole("dialog", { name: en.giveUpDialog.title }).getByRole("button", { name: en.header.giveUp }).click();
  await giveUpResponse;
  const inputResponse = page.waitForResponse("**/api/v1/games/*/inputs");
  releaseInput();
  await inputResponse;

  await expect(page.getByRole("region", { name: en.result.heading.cleared[modeOf("en")] })).toBeVisible();
  await expect.poll(() => playedWords(page)).toEqual([...before, fredagsmys.id]);
});
