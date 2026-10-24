import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ErrorMessage, ExpiredMessage } from "@/components/game/error-message";

const meta = {
  title: "Game/ErrorMessage",
  component: ErrorMessage,
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

/** ゲームが見つからないときの案内。 */
export const Expired: Story = {
  render: () => <ExpiredMessage />,
};
