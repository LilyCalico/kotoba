import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { ERROR_TEXT } from "@/components/game/error-message";
import { INPUT_LABEL } from "@/components/game/input-form";
import { GIVE_UP_FAILED_TEXT, GameScreen, START_FAILED_TEXT } from "@/components/game/play-screen";
import { toastQueue } from "@/components/ui/toast";
import { type GameClient, GameClientError } from "@/lib/game/client";
import { createMockGameClient } from "@/lib/game/mock-client";

/** 応答を待たせず、出題単語を固定し、出題済みの記録を残さないモック。 */
function mockClient(overrides: Partial<GameClient> = {}): GameClient {
  return {
    ...createMockGameClient({ wordId: "fredagsmys", delayMs: 0, storage: null }),
    ...overrides,
  };
}

function never<T>(): Promise<T> {
  return new Promise(() => {});
}

function fail(): Promise<never> {
  return Promise.reject(new GameClientError("モックの失敗"));
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
  args: { client: mockClient() },
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

/** 設問の提示。3 秒で、またはクリックかキー入力でチャットへ移る。 */
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
    await userEvent.click(await screen.findByRole("button", { name: /^Hint/ }));

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
    await expect(screen.getByRole("button", { name: /^Hint/ })).toBeDisabled();
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

/** 送信の失敗。ログにエラーを積み、入力欄に同じ文字列を戻す。 */
export const InputFailed: Story = {
  args: { client: mockClient({ sendInput: fail }) },
  play: async () => {
    await enterChat();
    await send("Is it about Friday?");

    await screen.findByText(ERROR_TEXT);
    await expect(screen.getByRole("textbox", { name: INPUT_LABEL })).toHaveValue(
      "Is it about Friday?",
    );
  },
};

/** ゲーム開始の失敗。Retry 付きのスナックバーで知らせる。 */
export const StartFailed: Story = {
  args: { client: mockClient({ startGame: fail }) },
  play: async () => {
    await screen.findByText(START_FAILED_TEXT);
  },
};

/** ギブアップの失敗。ダイアログを開いたままスナックバーで知らせる。 */
export const GiveUpFailed: Story = {
  args: { client: mockClient({ giveUp: fail }) },
  play: async () => {
    await enterChat();
    await userEvent.click(screen.getByRole("button", { name: "Give up" }));
    const dialog = await screen.findByRole("dialog", { name: "Give up?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Give up" }));

    await screen.findByText(GIVE_UP_FAILED_TEXT);
    await expect(dialog).toBeInTheDocument();
  },
};
