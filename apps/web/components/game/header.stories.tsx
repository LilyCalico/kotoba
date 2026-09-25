import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Header } from "@/components/game/header";

const meta = {
  title: "Game/Header",
  component: Header,
  args: { onGiveUp: () => undefined },
} satisfies Meta<typeof Header>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-full max-w-lg">
      <Header {...args} />
    </div>
  ),
};
