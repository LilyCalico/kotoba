import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, screen } from "storybook/test";
import { PendingIndicator } from "@/components/game/pending-indicator";
import { en } from "@/lib/i18n/messages";

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
  play: async () => {
    await expect(screen.queryByText(en.pending.slow)).not.toBeInTheDocument();
    await expect(await screen.findByText(en.pending.slow, {}, { timeout: 4000 })).toBeVisible();
  },
};
