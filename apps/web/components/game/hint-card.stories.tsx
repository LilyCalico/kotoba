import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { HintCard } from "@/components/game/hint-card";
import { PlayerMessage } from "@/components/game/player-message";
import { VerdictMessage } from "@/components/game/verdict-message";
import { Button } from "@/components/ui/button";

const HINTS = [
  "The word is tied to one particular day of the week",
  "It means staying in with family or a partner, with snacks bought for the occasion",
  "It is a compound of the name of a day and a word meaning coziness",
] as const;

const meta = {
  title: "Game/HintCard",
  component: HintCard,
  args: { index: 1, text: HINTS[0] },
  decorators: [
    (Story) => (
      <div className="flex w-full max-w-lg flex-col gap-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HintCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllThree: Story = {
  render: () => (
    <>
      {HINTS.map((text, index) => (
        <HintCard index={index + 1} key={text} text={text} />
      ))}
    </>
  ),
};

/** 回答バブルと並べ、フル幅・枠線・ラベルで見分けられることを確かめる。 */
export const AmongMessages: Story = {
  render: () => (
    <>
      <PlayerMessage text="Is it a noun?" />
      <VerdictMessage verdict="yes" />
      <HintCard index={1} text={HINTS[0]} />
      <PlayerMessage text="Is it something you do on a Friday?" />
      <VerdictMessage verdict="yes" />
    </>
  ),
};

/** 開示の動き。Reveal を押すたびにカードを描き直し、出現の動きをもう一度再生する。 */
export const Reveal: Story = {
  render: function Render(args) {
    const [count, setCount] = useState(1);

    return (
      <>
        <Button className="self-start" onPress={() => setCount((value) => value + 1)} variant="outline">
          Reveal
        </Button>
        <HintCard {...args} key={count} />
      </>
    );
  },
};
