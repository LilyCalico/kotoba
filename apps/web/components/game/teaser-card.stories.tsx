import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TeaserCard } from "@/components/game/teaser-card";

const meta = {
  title: "Game/TeaserCard",
  component: TeaserCard,
  args: { teaser: "On Friday night, this word lives on the sofa" },
  decorators: [
    (Story) => (
      <div className="w-full max-w-lg">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TeaserCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Floating: Story = {
  args: { variant: "floating" },
};

export const Pinned: Story = {
  args: { variant: "pinned" },
};
