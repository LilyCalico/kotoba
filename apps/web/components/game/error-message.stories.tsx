import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ErrorMessage, ExpiredMessage } from "@/components/game/error-message";

const meta = {
  title: "Game/ErrorMessage",
  component: ErrorMessage,
  args: { code: "network_error" },
  decorators: [
    (Story) => (
      <div className="flex w-full max-w-lg flex-col gap-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ErrorMessage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** AI の呼び出しの失敗。無料枠のため送り直せば通ることが多いと伝える。 */
export const AiUnavailable: Story = {
  args: { code: "ai_unavailable" },
};

/** 無料枠の AI が 1 分あたりの上限に達したとき。上限が戻るまでの時間を分で出す。 */
export const AiRateLimited: Story = {
  args: { code: "ai_rate_limited", retryAfterSeconds: 37 },
};

/** 無料枠の AI が 1 日あたりの上限に達したとき。太平洋時間の 0 時までの時間を時間で出す。 */
export const AiDailyLimit: Story = {
  args: { code: "ai_rate_limited", retryAfterSeconds: 7 * 3600 },
};

/** ゲームが見つからないときの案内。 */
export const Expired: Story = {
  render: () => <ExpiredMessage />,
};
