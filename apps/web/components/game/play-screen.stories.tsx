import { MAX_HINTS } from "@kotoba/shared";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { GameScreen } from "@/components/game/play-screen";
import { toastQueue } from "@/components/ui/toast";
import { type GameClient, GameClientError, type GameClientErrorCode } from "@/lib/game/client";
import { createMockGameClient } from "@/lib/game/mock-client";
import { en } from "@/lib/i18n/messages";

/** 応答を待たせず、出題単語を固定したモック。 */
function mockClient(overrides: Partial<GameClient> = {}): GameClient {
  return {
    ...createMockGameClient({ wordId: "fredagsmys", delayMs: 0 }),
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

async function enterChat() {
  await screen.findByText("On Friday night, this word lives on the sofa");
  await userEvent.click(document.body);
  await screen.findByRole("textbox", { name: en.input.label });
}

async function send(text: string) {
  const input = await screen.findByRole("textbox", { name: en.input.label });
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

/** 設問の提示。3 秒で、または Enter / Space / クリックでチャットへ移る。 */
export const Teaser: Story = {};

/** 5 値の回答、誤答、ヒントを 1 つずつ積んだチャット。 */
export const Chat: Story = {
  play: async () => {
    await enterChat();
    for (const question of [
      "Is it about Friday?",
      "Is it about the morning?",
      "Is it red?",
      "Is it expensive?",
      "What does it mean?",
      "hygge",
    ]) {
      await send(question);
    }
    await userEvent.click(await screen.findByRole("button", { name: en.hint.buttonLabel(MAX_HINTS) }));

    await screen.findByRole("region", { name: en.hint.title(1, MAX_HINTS) });
  },
};

/** 送信中。入力欄とヒントボタンを押せなくし、応答待ちのインジケーターを出す。 */
export const Sending: Story = {
  args: { client: mockClient({ sendInput: never }) },
  play: async () => {
    await enterChat();
    await send("Is it about Friday?");

    await expect(screen.getByRole("textbox", { name: en.input.label })).toBeDisabled();
    await expect(screen.getByRole("button", { name: en.hint.buttonLabel(MAX_HINTS) })).toBeDisabled();
  },
};

/** 応答待ちが 2 秒を超えた。読み込みバーの下に詫びの文言を添える。 */
export const SendingSlow: Story = {
  args: { client: mockClient({ sendInput: never }) },
  play: async () => {
    await enterChat();
    await send("Is it about Friday?");

    await expect(screen.queryByText(en.pending.slow)).not.toBeInTheDocument();
    await expect(await screen.findByText(en.pending.slow, {}, { timeout: 4000 })).toBeVisible();
  },
};

/** 正解。入力欄とヒントボタンを畳み、結果カードの下に Play again を置く。 */
export const Cleared: Story = {
  play: async () => {
    await enterChat();
    await send("fredagsmys");

    await screen.findByRole("heading", { name: en.result.heading.cleared });
    await expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    await expect(screen.getByRole("link", { name: en.play.playAgain })).toHaveAttribute("href", "/en");
  },
};

/** ギブアップ。 */
export const GaveUp: Story = {
  play: async () => {
    await enterChat();
    await userEvent.click(screen.getByRole("button", { name: en.header.giveUp }));
    const dialog = await screen.findByRole("dialog", { name: en.giveUpDialog.title });
    await userEvent.click(within(dialog).getByRole("button", { name: en.giveUpDialog.confirm }));

    await screen.findByRole("heading", { name: en.result.heading.gave_up });
  },
};

/**
 * 送信の失敗。ログにエラーを積んで読み上げ、入力欄に同じ文字列を戻してフォーカスを移す。
 */
export const InputFailed: Story = {
  args: { client: mockClient({ sendInput: fail() }) },
  play: async () => {
    await enterChat();
    await send("Is it about Friday?");

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(en.error.generic));
    const input = screen.getByRole("textbox", { name: en.input.label });
    await expect(input).toHaveValue("Is it about Friday?");
    await waitFor(() => expect(input).toHaveFocus());
  },
};

/** AI の呼び出しの失敗。共通の文言の代わりに、無料枠のため送り直せば通ることが多いと伝える。 */
export const InputFailedByAi: Story = {
  args: { client: mockClient({ sendInput: fail("ai_unavailable") }) },
  play: async () => {
    await enterChat();
    await send("Is it about Friday?");

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(en.error.aiUnavailable));
  },
};

/** 無料枠の AI の上限。上限が戻るまでの時間を添えて、そのころに送り直すよう伝える。 */
export const InputRateLimited: Story = {
  args: { client: mockClient({ sendInput: fail("ai_rate_limited", 37) }) },
  play: async () => {
    await enterChat();
    await send("Is it about Friday?");

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(en.error.aiLimit(37)));
  },
};

/** 入力のレートリミット超過。数え直されるまでの時間を添えて、そのころに送り直すよう伝える。 */
export const InputRateLimitExceeded: Story = {
  args: { client: mockClient({ sendInput: fail("rate_limited", 45) }) },
  play: async () => {
    await enterChat();
    await send("Is it about Friday?");

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(en.error.rateLimit(45)));
  },
};

/** ヒントの要求の失敗。ログにエラーを積んで読み上げ、ヒントボタンにフォーカスを戻す。 */
export const HintFailed: Story = {
  args: { client: mockClient({ revealHint: fail() }) },
  play: async () => {
    await enterChat();
    const hint = screen.getByRole("button", { name: en.hint.buttonLabel(MAX_HINTS) });
    await userEvent.click(hint);

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(en.error.generic));
    await waitFor(() => expect(hint).toHaveFocus());
  },
};

/** ゲーム開始の失敗。Retry 付きのスナックバーで知らせる。 */
export const StartFailed: Story = {
  args: { client: mockClient({ startGame: fail() }) },
  play: async () => {
    await screen.findByText(en.play.startFailed);
  },
};

/** ゲーム開始のレートリミット超過。数え直されるまでの時間を添え、Retry を残す。 */
export const StartRateLimited: Story = {
  args: { client: mockClient({ startGame: fail("rate_limited", 45) }) },
  play: async () => {
    await screen.findByText(en.play.startLimit(45));
    await expect(screen.getByRole("button", { name: en.play.retry })).toBeVisible();
  },
};

/** ギブアップの失敗。ダイアログを開いたままスナックバーで知らせる。 */
export const GiveUpFailed: Story = {
  args: { client: mockClient({ giveUp: fail() }) },
  play: async () => {
    await enterChat();
    await userEvent.click(screen.getByRole("button", { name: en.header.giveUp }));
    const dialog = await screen.findByRole("dialog", { name: en.giveUpDialog.title });
    await userEvent.click(within(dialog).getByRole("button", { name: en.giveUpDialog.confirm }));

    await screen.findByText(en.play.giveUpFailed);
    await expect(dialog).toBeInTheDocument();
  },
};

/** ゲームが見つからない。案内を積んで入力欄とヒントボタンを畳み、Play again を出す。 */
export const Expired: Story = {
  args: { client: mockClient({ sendInput: fail("game_not_found") }) },
  play: async () => {
    await enterChat();
    await send("Is it about Friday?");

    await waitFor(() => expect(screen.getByText(en.error.expired)).toHaveFocus());
    await expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    await expect(screen.queryByRole("button", { name: en.hint.buttonLabel(MAX_HINTS) })).not.toBeInTheDocument();
    await expect(screen.getByRole("link", { name: en.play.playAgain })).toHaveAttribute("href", "/en");
  },
};

/** ギブアップでゲームが見つからない。ダイアログを閉じて、送信のときと同じ案内を出す。 */
export const GiveUpExpired: Story = {
  args: { client: mockClient({ giveUp: fail("game_not_found") }) },
  play: async () => {
    await enterChat();
    await userEvent.click(screen.getByRole("button", { name: en.header.giveUp }));
    const dialog = await screen.findByRole("dialog", { name: en.giveUpDialog.title });
    await userEvent.click(within(dialog).getByRole("button", { name: en.giveUpDialog.confirm }));

    await screen.findByText(en.error.expired);
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(screen.getByRole("link", { name: en.play.playAgain })).toBeInTheDocument();
  },
};

/** 画面側で塞いでいるはずの操作の失敗。何も出さず、応答待ちだけを解く。 */
export const IgnoredFailure: Story = {
  args: { client: mockClient({ revealHint: fail("hint_out_of_order") }) },
  play: async () => {
    await enterChat();
    const hint = screen.getByRole("button", { name: en.hint.buttonLabel(MAX_HINTS) });
    await userEvent.click(hint);

    await waitFor(() => expect(hint).toBeEnabled());
    await expect(screen.queryByText(en.error.generic)).not.toBeInTheDocument();
  },
};

/** 対応外の言語の入力。案内を積んで読み上げ、同じ入力欄から続けて送れる。 */
export const UnsupportedLanguage: Story = {
  args: {
    client: mockClient({ sendInput: async () => ({ kind: "unsupported_language" }) }),
  },
  play: async () => {
    await enterChat();
    await send("Är det mat? 这是食物吗");

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(en.unsupportedLanguage),
    );
    await expect(screen.getByRole("textbox", { name: en.input.label })).toBeEnabled();
  },
};
