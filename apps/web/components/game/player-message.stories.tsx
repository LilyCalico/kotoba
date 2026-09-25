import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlayerMessage } from "@/components/game/player-message";

const meta = {
  title: "Game/PlayerMessage",
  component: PlayerMessage,
  args: { text: "Is it something you do on a Friday?" },
} satisfies Meta<typeof PlayerMessage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <PlayerMessage {...args} />
      <PlayerMessage text="Give me a hint" />
      <PlayerMessage text="Is it a compound of a day of the week and a word that means being comfortable at home with people you like?" />
    </div>
  ),
};
