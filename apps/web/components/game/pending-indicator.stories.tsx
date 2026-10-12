import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PendingIndicator } from "@/components/game/pending-indicator";

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
