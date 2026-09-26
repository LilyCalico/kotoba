import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ErrorMessage } from "@/components/game/error-message";

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
