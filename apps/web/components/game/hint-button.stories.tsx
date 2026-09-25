import { MAX_HINTS } from "@kotoba/shared";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HintButton } from "@/components/game/hint-button";

const meta = {
  title: "Game/HintButton",
  component: HintButton,
  args: { remaining: MAX_HINTS, onPress: () => undefined },
} satisfies Meta<typeof HintButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sending: Story = {
  args: { disabled: true },
};

export const Countdown: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-3">
      {[MAX_HINTS, 2, 1, 0].map((remaining) => (
        <HintButton {...args} key={remaining} remaining={remaining} />
      ))}
    </div>
  ),
};
