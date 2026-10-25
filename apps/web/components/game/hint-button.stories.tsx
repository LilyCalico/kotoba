import { MAX_HINTS } from "@kotoba/shared";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, within } from "storybook/test";
import { HintButton, hintButtonText } from "@/components/game/hint-button";

const meta = {
  title: "Game/HintButton",
  component: HintButton,
  args: { remaining: MAX_HINTS, onPress: fn() },
} satisfies Meta<typeof HintButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sending: Story = {
  args: { disabled: true },
};

/** 残り 3〜0 を並べる。0 だけが押せない。 */
export const Countdown: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-3">
      {[3, 2, 1, 0].map((remaining) => (
        <HintButton {...args} key={remaining} remaining={remaining} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    for (const remaining of [3, 2, 1]) {
      await expect(canvas.getByRole("button", { name: hintButtonText(remaining) })).toBeEnabled();
    }
    await expect(canvas.getByRole("button", { name: hintButtonText(0) })).toBeDisabled();
  },
};
