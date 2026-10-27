import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowUpIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

const meta = {
  title: "UI/Button",
  component: Button,
  args: {
    children: "Send",
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Start a game</Button>
      <Button aria-label="Send" size="icon-lg" variant="key">
        <ArrowUpIcon aria-hidden className="size-5" strokeWidth={2.4} />
      </Button>
      <Button variant="secondary">Give me a hint</Button>
      <Button variant="outline">Cancel</Button>
      <Button variant="ghost">Close</Button>
      <Button variant="link">How to play</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="xs">xs</Button>
      <Button size="sm">sm</Button>
      <Button size="default">default</Button>
      <Button size="lg">lg</Button>
    </div>
  ),
};

export const Disabled: Story = {
  args: { isDisabled: true },
};
