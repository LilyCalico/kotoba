import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LeafScatter } from "@/components/game/leaf-scatter";

const meta = {
  title: "Game/LeafScatter",
  component: LeafScatter,
  args: { variant: "start" },
  decorators: [
    (Story) => (
      <div className="relative aspect-[402/874] w-full max-w-sm overflow-hidden rounded-2xl border border-border">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LeafScatter>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Start: Story = {};

export const Teaser: Story = {
  args: { variant: "teaser" },
};
