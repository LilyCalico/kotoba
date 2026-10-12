import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRef } from "react";
import { expect, userEvent, within } from "storybook/test";
import { ResultCard } from "@/components/game/result-card";
import { Button } from "@/components/ui/button";

const meta = {
  title: "Game/ResultCard",
  component: ResultCard,
  args: {
    outcome: "cleared",
    word: "Fredagsmys",
    definition:
      "The habit of settling onto the sofa with family or a partner on a Friday night, snacks at hand.",
  },
  decorators: [
    (Story) => (
      <div className="flex w-full max-w-lg flex-col gap-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ResultCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Cleared: Story = {};

export const GaveUp: Story = {
  args: { outcome: "gave_up" },
};

/** ゲーム終了時と同じく、`ref` 経由で見出しへフォーカスを移す。 */
export const FocusHeading: Story = {
  render: function Render(args) {
    const headingRef = useRef<HTMLHeadingElement>(null);

    return (
      <>
        <Button onPress={() => headingRef.current?.focus()}>Focus the heading</Button>
        <ResultCard {...args} ref={headingRef} />
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("button", { name: "Focus the heading" }));

    await expect(canvas.getByRole("heading", { name: "You found it" })).toHaveFocus();
  },
};
