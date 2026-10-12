import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { Header } from "@/components/game/header";

const meta = {
  title: "Game/Header",
  component: Header,
  args: { onGiveUp: fn() },
  decorators: [
    (Story) => (
      <div className="w-full max-w-lg">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Header>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
