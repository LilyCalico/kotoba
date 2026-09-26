import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LeafScatter } from "@/components/game/leaf-scatter";

const meta = {
  title: "Game/LeafScatter",
  component: LeafScatter,
} satisfies Meta<typeof LeafScatter>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Start: Story = {
  render: () => (
    <div className="relative h-[32rem] w-full max-w-lg overflow-hidden rounded-2xl border border-border">
      <LeafScatter variant="start" />
    </div>
  ),
};

export const Teaser: Story = {
  render: () => (
    <div className="relative h-[32rem] w-full max-w-lg overflow-hidden rounded-2xl border border-border">
      <LeafScatter variant="teaser" />
    </div>
  ),
};
