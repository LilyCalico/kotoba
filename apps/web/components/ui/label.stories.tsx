import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const meta = {
  title: "UI/Label",
  component: Label,
  args: {
    children: "Question or guess",
  },
} satisfies Meta<typeof Label>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ForInput: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-2">
      <Label htmlFor="label-question">Question or guess</Label>
      <Input id="label-question" placeholder="Is it tied to Fridays?" />
    </div>
  ),
};
