import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PendingIndicator } from "@/components/game/pending-indicator";
import { PlayerMessage } from "@/components/game/player-message";

const meta = {
  title: "Game/PendingIndicator",
  component: PendingIndicator,
} satisfies Meta<typeof PendingIndicator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <PlayerMessage text="Is it something you do on a Friday?" />
      <PendingIndicator />
    </div>
  ),
};
