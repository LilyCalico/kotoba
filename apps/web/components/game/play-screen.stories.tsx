import { MAX_HINTS, type UiLocale } from "@kotoba/shared";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { GameScreen } from "@/components/game/play-screen";
import { toastQueue } from "@/components/ui/toast";
import { type GameClient, GameClientError, type GameClientErrorCode } from "@/lib/game/client";
import { fixtureWord } from "@/lib/game/fixtures";
import { createMockGameClient } from "@/lib/game/mock-client";
import { messages } from "@/lib/i18n/messages";
import { storyGameMode, storyLocale, storyMessages } from "@/lib/i18n/story-locale";

/** 出題する単語。 */
const fredagsmys = fixtureWord("fredagsmys");

/**
 * 正解の入力。単語当てでは単語そのもの、意味当てでは判定基準の正解の例。
 * モックは意味の言い換えを判定しないため、正解の例と同じ文を送る。
 */
function answerFor(globals: Record<string, unknown>): string {
  return storyGameMode(globals) === "guess_meaning" ? (fredagsmys.meaning.accepts[0] ?? "") : fredagsmys.word;
}

/** ゲームの最初に見せるもの。単語当てでは設問、意味当てでは単語。 */
function openingFor(globals: Record<string, unknown>): string {
  return storyGameMode(globals) === "guess_meaning" ? fredagsmys.word : fredagsmys.teaser[storyLocale(globals)];
}

/** 送信の失敗を確かめる Story で送る質問。 */
const QUESTION: Record<UiLocale, string> = {
  en: "Is it about Friday?",
  ja: "金曜日に関係ある？",
};

/** 5 値の回答（はい・いいえ・どちらとも・関係ない・質問になっていない）と誤答を、1 つずつ引き出す入力。 */
const CHAT_INPUTS: Record<UiLocale, readonly string[]> = {
  en: [
    "Is it about Friday?",
    "Is it about the morning?",
    "Is it red?",
    "Is it expensive?",
    "What does it mean?",
    "hygge",
  ],
  ja: [
    "金曜日に関係ある？",
    "朝のこと？",
    "赤い？",
    "値段は高い？",
    "どういう意味？",
    "ヒュッゲ",
  ],
};

/** 応答を待たせず、出題単語を固定したモック。 */
function mockClient(overrides: Partial<GameClient> = {}): GameClient {
  return {
    ...createMockGameClient({ wordId: fredagsmys.id, delayMs: 0 }),
    ...overrides,
  };
}

function never<T>(): Promise<T> {
  return new Promise(() => {});
}

function fail(
  code: GameClientErrorCode = "network_error",
  retryAfterSeconds?: number,
): () => Promise<never> {
  return () => Promise.reject(new GameClientError(code, "モックの失敗", { retryAfterSeconds }));
}

/** ツールバーで選んだ言語と遊び方の、入力欄の名前。 */
function inputLabel(globals: Record<string, unknown>): string {
  return storyMessages(globals).input.label[storyGameMode(globals)];
}

async function enterChat(globals: Record<string, unknown>) {
  await screen.findByText(openingFor(globals));
  await userEvent.click(document.body);
  await screen.findByRole("textbox", { name: inputLabel(globals) });
}

async function send(globals: Record<string, unknown>, text: string) {
  const input = await screen.findByRole("textbox", { name: inputLabel(globals) });
  await waitFor(() => expect(input).toBeEnabled());
  await userEvent.type(input, `${text}{Enter}`);
}

const meta = {
  title: "Game/PlayScreen",
  component: GameScreen,
  parameters: { page: true },
  // 出題済みの記録は残さない。
  args: { client: mockClient(), storage: null },
  beforeEach: () => {
    toastQueue.clear();
  },
} satisfies Meta<typeof GameScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

/** ゲーム開始の応答待ち。 */
export const Starting: Story = {
  args: { client: mockClient({ startGame: never }) },
};

/** 最初に見せるもの（英語は設問、日本語は単語）の提示。3 秒で、または Enter / Space / クリックでチャットへ移る。 */
export const Teaser: Story = {};

/** 5 値の回答、誤答、ヒントを 1 つずつ積んだチャット。 */
export const Chat: Story = {
  play: async ({ globals }) => {
    const locale = storyLocale(globals);
    const t = messages[locale];
    await enterChat(globals);
    for (const input of CHAT_INPUTS[locale]) {
      await send(globals, input);
    }
    await userEvent.click(await screen.findByRole("button", { name: t.hint.buttonLabel(MAX_HINTS) }));

    await screen.findByRole("region", { name: t.hint.title(1, MAX_HINTS) });
  },
};

/** 送信中。入力欄とヒントボタンを押せなくし、応答待ちのインジケーターを出す。 */
export const Sending: Story = {
  args: { client: mockClient({ sendInput: never }) },
  play: async ({ globals }) => {
    const locale = storyLocale(globals);
    const t = messages[locale];
    await enterChat(globals);
    await send(globals, QUESTION[locale]);

    await expect(screen.getByRole("textbox", { name: t.input.label[storyGameMode(globals)] })).toBeDisabled();
    await expect(screen.getByRole("button", { name: t.hint.buttonLabel(MAX_HINTS) })).toBeDisabled();
  },
};

/** 応答待ちが 2 秒を超えた。読み込みバーの下に詫びの文言を添える。 */
export const SendingSlow: Story = {
  args: { client: mockClient({ sendInput: never }) },
  play: async ({ globals }) => {
    const locale = storyLocale(globals);
    const t = messages[locale];
    await enterChat(globals);
    await send(globals, QUESTION[locale]);

    await expect(screen.queryByText(t.pending.slow)).not.toBeInTheDocument();
    await expect(await screen.findByText(t.pending.slow, {}, { timeout: 4000 })).toBeVisible();
  },
};

/** 正解。入力欄とヒントボタンを畳み、結果カードの下に Play again を置く。 */
export const Cleared: Story = {
  play: async ({ globals }) => {
    const locale = storyLocale(globals);
    const t = messages[locale];
    await enterChat(globals);
    await send(globals, answerFor(globals));

    await screen.findByRole("heading", { name: t.result.heading.cleared[storyGameMode(globals)] });
    await expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    await expect(screen.getByRole("link", { name: t.play.playAgain })).toHaveAttribute("href", `/${locale}`);
  },
};

/** ギブアップ。 */
export const GaveUp: Story = {
  play: async ({ globals }) => {
    const locale = storyLocale(globals);
    const t = messages[locale];
    await enterChat(globals);
    await userEvent.click(screen.getByRole("button", { name: t.header.giveUp }));
    const dialog = await screen.findByRole("dialog", { name: t.giveUpDialog.title });
    await userEvent.click(within(dialog).getByRole("button", { name: t.giveUpDialog.confirm }));

    await screen.findByRole("heading", { name: t.result.heading.gave_up[storyGameMode(globals)] });
  },
};

/**
 * 送信の失敗。ログにエラーを積んで読み上げ、入力欄に同じ文字列を戻してフォーカスを移す。
 */
export const InputFailed: Story = {
  args: { client: mockClient({ sendInput: fail() }) },
  play: async ({ globals }) => {
    const locale = storyLocale(globals);
    const t = messages[locale];
    await enterChat(globals);
    await send(globals, QUESTION[locale]);

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(t.error.generic));
    const input = screen.getByRole("textbox", { name: t.input.label[storyGameMode(globals)] });
    await expect(input).toHaveValue(QUESTION[locale]);
    await waitFor(() => expect(input).toHaveFocus());
  },
};

/** AI の呼び出しの失敗。共通の文言の代わりに、無料枠のため送り直せば通ることが多いと伝える。 */
export const InputFailedByAi: Story = {
  args: { client: mockClient({ sendInput: fail("ai_unavailable") }) },
  play: async ({ globals }) => {
    const locale = storyLocale(globals);
    const t = messages[locale];
    await enterChat(globals);
    await send(globals, QUESTION[locale]);

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(t.error.aiUnavailable));
  },
};

/** 無料枠の AI の上限。上限が戻るまでの時間を添えて、そのころに送り直すよう伝える。 */
export const InputRateLimited: Story = {
  args: { client: mockClient({ sendInput: fail("ai_rate_limited", 37) }) },
  play: async ({ globals }) => {
    const locale = storyLocale(globals);
    const t = messages[locale];
    await enterChat(globals);
    await send(globals, QUESTION[locale]);

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(t.error.aiLimit(37)));
  },
};

/** 入力のレートリミット超過。数え直されるまでの時間を添えて、そのころに送り直すよう伝える。 */
export const InputRateLimitExceeded: Story = {
  args: { client: mockClient({ sendInput: fail("rate_limited", 45) }) },
  play: async ({ globals }) => {
    const locale = storyLocale(globals);
    const t = messages[locale];
    await enterChat(globals);
    await send(globals, QUESTION[locale]);

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(t.error.rateLimit(45)));
  },
};

/** ヒントの要求の失敗。ログにエラーを積んで読み上げ、ヒントボタンにフォーカスを戻す。 */
export const HintFailed: Story = {
  args: { client: mockClient({ revealHint: fail() }) },
  play: async ({ globals }) => {
    const locale = storyLocale(globals);
    const t = messages[locale];
    await enterChat(globals);
    const hint = screen.getByRole("button", { name: t.hint.buttonLabel(MAX_HINTS) });
    await userEvent.click(hint);

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(t.error.generic));
    await waitFor(() => expect(hint).toHaveFocus());
  },
};

/** ゲーム開始の失敗。Retry 付きのスナックバーで知らせる。 */
export const StartFailed: Story = {
  args: { client: mockClient({ startGame: fail() }) },
  play: async ({ globals }) => {
    const t = messages[storyLocale(globals)];
    await screen.findByText(t.play.startFailed);
  },
};

/** ゲーム開始のレートリミット超過。数え直されるまでの時間を添え、Retry を残す。 */
export const StartRateLimited: Story = {
  args: { client: mockClient({ startGame: fail("rate_limited", 45) }) },
  play: async ({ globals }) => {
    const t = messages[storyLocale(globals)];
    await screen.findByText(t.play.startLimit(45));
    await expect(screen.getByRole("button", { name: t.play.retry })).toBeVisible();
  },
};

/** ギブアップの失敗。ダイアログを開いたままスナックバーで知らせる。 */
export const GiveUpFailed: Story = {
  args: { client: mockClient({ giveUp: fail() }) },
  play: async ({ globals }) => {
    const locale = storyLocale(globals);
    const t = messages[locale];
    await enterChat(globals);
    await userEvent.click(screen.getByRole("button", { name: t.header.giveUp }));
    const dialog = await screen.findByRole("dialog", { name: t.giveUpDialog.title });
    await userEvent.click(within(dialog).getByRole("button", { name: t.giveUpDialog.confirm }));

    await screen.findByText(t.play.giveUpFailed);
    await expect(dialog).toBeInTheDocument();
  },
};

/** ゲームが見つからない。案内を積んで入力欄とヒントボタンを畳み、Play again を出す。 */
export const Expired: Story = {
  args: { client: mockClient({ sendInput: fail("game_not_found") }) },
  play: async ({ globals }) => {
    const locale = storyLocale(globals);
    const t = messages[locale];
    await enterChat(globals);
    await send(globals, QUESTION[locale]);

    await waitFor(() => expect(screen.getByText(t.error.expired)).toHaveFocus());
    await expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    await expect(screen.queryByRole("button", { name: t.hint.buttonLabel(MAX_HINTS) })).not.toBeInTheDocument();
    await expect(screen.getByRole("link", { name: t.play.playAgain })).toHaveAttribute("href", `/${locale}`);
  },
};

/** ギブアップでゲームが見つからない。ダイアログを閉じて、送信のときと同じ案内を出す。 */
export const GiveUpExpired: Story = {
  args: { client: mockClient({ giveUp: fail("game_not_found") }) },
  play: async ({ globals }) => {
    const locale = storyLocale(globals);
    const t = messages[locale];
    await enterChat(globals);
    await userEvent.click(screen.getByRole("button", { name: t.header.giveUp }));
    const dialog = await screen.findByRole("dialog", { name: t.giveUpDialog.title });
    await userEvent.click(within(dialog).getByRole("button", { name: t.giveUpDialog.confirm }));

    await screen.findByText(t.error.expired);
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(screen.getByRole("link", { name: t.play.playAgain })).toBeInTheDocument();
  },
};

/** 画面側で塞いでいるはずの操作の失敗。何も出さず、応答待ちだけを解く。 */
export const IgnoredFailure: Story = {
  args: { client: mockClient({ revealHint: fail("hint_out_of_order") }) },
  play: async ({ globals }) => {
    const locale = storyLocale(globals);
    const t = messages[locale];
    await enterChat(globals);
    const hint = screen.getByRole("button", { name: t.hint.buttonLabel(MAX_HINTS) });
    await userEvent.click(hint);

    await waitFor(() => expect(hint).toBeEnabled());
    await expect(screen.queryByText(t.error.generic)).not.toBeInTheDocument();
  },
};

/** 対応外の言語の入力。案内を積んで読み上げ、同じ入力欄から続けて送れる。 */
export const UnsupportedLanguage: Story = {
  args: {
    client: mockClient({ sendInput: async () => ({ kind: "unsupported_language" }) }),
  },
  play: async ({ globals }) => {
    const locale = storyLocale(globals);
    const t = messages[locale];
    await enterChat(globals);
    await send(globals, "Är det mat? 这是食物吗");

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(t.unsupportedLanguage),
    );
    await expect(screen.getByRole("textbox", { name: t.input.label[storyGameMode(globals)] })).toBeEnabled();
  },
};
