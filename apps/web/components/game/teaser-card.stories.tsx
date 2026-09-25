import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TeaserCard } from "@/components/game/teaser-card";

const TEASER = "On Friday night, this word lives on the sofa";

const meta = {
  title: "Game/TeaserCard",
  component: TeaserCard,
  args: { teaser: TEASER },
} satisfies Meta<typeof TeaserCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Presented: Story = {
  args: { variant: "presented" },
  render: (args) => (
    <div className="w-full max-w-lg">
      <TeaserCard {...args} />
    </div>
  ),
};

export const Pinned: Story = {
  args: { variant: "pinned" },
  render: (args) => (
    <div className="w-full max-w-lg">
      <TeaserCard {...args} />
    </div>
  ),
};
