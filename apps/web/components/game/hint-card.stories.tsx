import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HintCard } from "@/components/game/hint-card";

const HINTS = [
  "The word is tied to one particular day of the week",
  "It means staying in with family or a partner, with snacks bought for the occasion",
  "It is a compound of the name of a day and a word meaning coziness",
] as const;

const meta = {
  title: "Game/HintCard",
  component: HintCard,
  args: { hint: { index: 1, text: HINTS[0] } },
} satisfies Meta<typeof HintCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-full max-w-lg">
      <HintCard {...args} />
    </div>
  ),
};

export const AllThree: Story = {
  render: () => (
    <div className="flex w-full max-w-lg flex-col gap-3">
      {HINTS.map((text, index) => (
        <HintCard hint={{ index: index + 1, text }} key={text} />
      ))}
    </div>
  ),
};
