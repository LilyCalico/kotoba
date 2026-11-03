import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, screen } from "storybook/test";
import { PendingIndicator, SLOW_PENDING_TEXT } from "@/components/game/pending-indicator";

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
    await expect(screen.queryByText(SLOW_PENDING_TEXT)).not.toBeInTheDocument();
    await expect(await screen.findByText(SLOW_PENDING_TEXT, {}, { timeout: 4000 })).toBeVisible();
  },
};
