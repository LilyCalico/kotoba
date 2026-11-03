import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import {
  AI_ERROR_TEXT,
  ERROR_TEXT,
  EXPIRED_TEXT,
  aiLimitText,
  rateLimitText,
} from "@/components/game/error-message";
import { INPUT_LABEL } from "@/components/game/input-form";
import { SLOW_PENDING_TEXT } from "@/components/game/pending-indicator";
import {
  GIVE_UP_FAILED_TEXT,
  GameScreen,
  START_FAILED_TEXT,
  startLimitText,
} from "@/components/game/play-screen";
import { UNSUPPORTED_LANGUAGE_TEXT } from "@/components/game/verdict-message";
import { toastQueue } from "@/components/ui/toast";
import { type GameClient, GameClientError, type GameClientErrorCode } from "@/lib/game/client";
import { createMockGameClient } from "@/lib/game/mock-client";

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
  await screen.findByRole("textbox", { name: INPUT_LABEL });
}

async function send(text: string) {
  const input = await screen.findByRole("textbox", { name: INPUT_LABEL });
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
    await userEvent.click(await screen.findByRole("button", { name: /^Show a hint/ }));

    await screen.findByRole("region", { name: "Hint 1 of 3" });
  },
};

/** 送信中。入力欄とヒントボタンを押せなくし、応答待ちのインジケーターを出す。 */
export const Sending: Story = {
  args: { client: mockClient({ sendInput: never }) },
  play: async () => {
    await enterChat();
    await send("Is it about Friday?");

    await expect(screen.getByRole("textbox", { name: INPUT_LABEL })).toBeDisabled();
    await expect(screen.getByRole("button", { name: /^Show a hint/ })).toBeDisabled();
  },
};

/** 応答待ちが 2 秒を超えた。読み込みバーの下に詫びの文言を添える。 */
export const SendingSlow: Story = {
  args: { client: mockClient({ sendInput: never }) },
  play: async () => {
    await enterChat();
    await send("Is it about Friday?");

    await expect(screen.queryByText(SLOW_PENDING_TEXT)).not.toBeInTheDocument();
    await expect(await screen.findByText(SLOW_PENDING_TEXT, {}, { timeout: 4000 })).toBeVisible();
  },
};

/** 正解。入力欄とヒントボタンを畳み、結果カードの下に Play again を置く。 */
export const Cleared: Story = {
  play: async () => {
    await enterChat();
    await send("fredagsmys");

    await screen.findByRole("heading", { name: "You found it" });
    await expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    await expect(screen.getByRole("link", { name: "Play again" })).toHaveAttribute("href", "/");
  },
};

/** ギブアップ。 */
export const GaveUp: Story = {
  play: async () => {
    await enterChat();
    await userEvent.click(screen.getByRole("button", { name: "Give up" }));
    const dialog = await screen.findByRole("dialog", { name: "Give up?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Give up" }));

    await screen.findByRole("heading", { name: "The word was" });
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

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(ERROR_TEXT));
    const input = screen.getByRole("textbox", { name: INPUT_LABEL });
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

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(AI_ERROR_TEXT));
  },
};

/** 無料枠の AI の上限。上限が戻るまでの時間を添えて、そのころに送り直すよう伝える。 */
export const InputRateLimited: Story = {
  args: { client: mockClient({ sendInput: fail("ai_rate_limited", 37) }) },
  play: async () => {
    await enterChat();
    await send("Is it about Friday?");

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(aiLimitText(37)));
    await expect(screen.getByRole("status")).toHaveTextContent("in about a minute");
  },
};

/** 入力のレートリミット超過。数え直されるまでの時間を添えて、そのころに送り直すよう伝える。 */
export const InputRateLimitExceeded: Story = {
  args: { client: mockClient({ sendInput: fail("rate_limited", 45) }) },
  play: async () => {
    await enterChat();
    await send("Is it about Friday?");

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(rateLimitText(45)));
    await expect(screen.getByRole("status")).toHaveTextContent("in about a minute");
  },
};

/** ヒントの要求の失敗。ログにエラーを積んで読み上げ、ヒントボタンにフォーカスを戻す。 */
export const HintFailed: Story = {
  args: { client: mockClient({ revealHint: fail() }) },
  play: async () => {
    await enterChat();
    const hint = screen.getByRole("button", { name: /^Show a hint/ });
    await userEvent.click(hint);

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(ERROR_TEXT));
    await waitFor(() => expect(hint).toHaveFocus());
  },
};

/** ゲーム開始の失敗。Retry 付きのスナックバーで知らせる。 */
export const StartFailed: Story = {
  args: { client: mockClient({ startGame: fail() }) },
  play: async () => {
    await screen.findByText(START_FAILED_TEXT);
  },
};

/** ゲーム開始のレートリミット超過。数え直されるまでの時間を添え、Retry を残す。 */
export const StartRateLimited: Story = {
  args: { client: mockClient({ startGame: fail("rate_limited", 45) }) },
  play: async () => {
    await screen.findByText(startLimitText(45));
    await expect(screen.getByText("Too many new games. Try again in about a minute.")).toBeVisible();
    await expect(screen.getByRole("button", { name: "Retry" })).toBeVisible();
  },
};

/** ギブアップの失敗。ダイアログを開いたままスナックバーで知らせる。 */
export const GiveUpFailed: Story = {
  args: { client: mockClient({ giveUp: fail() }) },
  play: async () => {
    await enterChat();
    await userEvent.click(screen.getByRole("button", { name: "Give up" }));
    const dialog = await screen.findByRole("dialog", { name: "Give up?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Give up" }));

    await screen.findByText(GIVE_UP_FAILED_TEXT);
    await expect(dialog).toBeInTheDocument();
  },
};

/** ゲームが見つからない。案内を積んで入力欄とヒントボタンを畳み、Play again を出す。 */
export const Expired: Story = {
  args: { client: mockClient({ sendInput: fail("game_not_found") }) },
  play: async () => {
    await enterChat();
    await send("Is it about Friday?");

    await waitFor(() => expect(screen.getByText(EXPIRED_TEXT)).toHaveFocus());
    await expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    await expect(screen.queryByRole("button", { name: /^Show a hint/ })).not.toBeInTheDocument();
    await expect(screen.getByRole("link", { name: "Play again" })).toHaveAttribute("href", "/");
  },
};

/** ギブアップでゲームが見つからない。ダイアログを閉じて、送信のときと同じ案内を出す。 */
export const GiveUpExpired: Story = {
  args: { client: mockClient({ giveUp: fail("game_not_found") }) },
  play: async () => {
    await enterChat();
    await userEvent.click(screen.getByRole("button", { name: "Give up" }));
    const dialog = await screen.findByRole("dialog", { name: "Give up?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Give up" }));

    await screen.findByText(EXPIRED_TEXT);
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(screen.getByRole("link", { name: "Play again" })).toBeInTheDocument();
  },
};

/** 画面側で塞いでいるはずの操作の失敗。何も出さず、応答待ちだけを解く。 */
export const IgnoredFailure: Story = {
  args: { client: mockClient({ revealHint: fail("hint_out_of_order") }) },
  play: async () => {
    await enterChat();
    const hint = screen.getByRole("button", { name: /^Show a hint/ });
    await userEvent.click(hint);

    await waitFor(() => expect(hint).toBeEnabled());
    await expect(screen.queryByText(ERROR_TEXT)).not.toBeInTheDocument();
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
      expect(screen.getByRole("status")).toHaveTextContent(UNSUPPORTED_LANGUAGE_TEXT),
    );
    await expect(screen.getByRole("textbox", { name: INPUT_LABEL })).toBeEnabled();
  },
};
