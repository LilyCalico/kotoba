import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, screen, userEvent } from "storybook/test";
import { StartScreen } from "@/components/game/start-screen";
import { storyMessages } from "@/lib/i18n/story-locale";
import { BOOT_SEEN_KEY, type BootStorage } from "@/lib/game/boot";

/** 起動画面を見たかの記録を、story ごとに持つ記録先。 */
function memoryStorage(seen: boolean): BootStorage {
  const values = new Map(seen ? [[BOOT_SEEN_KEY, "1"]] : []);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

const meta = {
  title: "Game/StartScreen",
  component: StartScreen,
  parameters: { page: true },
} satisfies Meta<typeof StartScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

/** サイトを開いたときの起動画面。1 文字ずつ打ち込み、打ち終えて一拍おくとスタート画面へ移る。 */
export const Boot: Story = {
  args: { storage: memoryStorage(false) },
};

/** 打ち終えた起動画面。打ち込みを止め、文を全部出したまま留まる。 */
export const BootTyped: Story = {
  args: { storage: memoryStorage(false), autoplay: false },
};

/** 同じタブで 2 回目に開いたとき。起動画面を出さず、スタート画面から始める。 */
export const Welcome: Story = {
  args: { storage: memoryStorage(true) },
};

/** Skip を押すとスタート画面が開き、見出しへフォーカスが移る。 */
export const Skip: Story = {
  args: { storage: memoryStorage(false), autoplay: false },
  play: async ({ globals }) => {
    const t = storyMessages(globals);
    await userEvent.click(await screen.findByRole("button", { name: t.start.skip }));

    await expect(await screen.findByRole("link", { name: t.start.startGame })).toBeVisible();
    await expect(screen.getByRole("heading", { level: 1 })).toHaveFocus();
  },
};
