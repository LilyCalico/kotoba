import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, screen } from "storybook/test";
import { PendingIndicator } from "@/components/game/pending-indicator";
import { storyMessages } from "@/lib/i18n/story-locale";

const meta = {
  title: "Game/PendingIndicator",
  component: PendingIndicator,
  decorators: [
    (Story) => (
      <div className="flex w-full max-w-lg flex-col gap-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PendingIndicator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** チャットの応答待ちが 2 秒を超えた。読み込みバーの下に詫びの文言を出す。 */
export const Slow: Story = {
  args: { slowNotice: true },
  play: async ({ globals }) => {
    const t = storyMessages(globals);
    await expect(screen.queryByText(t.pending.slow)).not.toBeInTheDocument();
    await expect(await screen.findByText(t.pending.slow, {}, { timeout: 4000 })).toBeVisible();
  },
};
