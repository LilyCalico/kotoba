import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ErrorMessage } from "@/components/game/error-message";

const meta = {
  title: "Game/ErrorMessage",
  component: ErrorMessage,
} satisfies Meta<typeof ErrorMessage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-full max-w-lg">
      <ErrorMessage />
    </div>
  ),
};
