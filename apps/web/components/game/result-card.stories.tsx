import type { GameResult } from "@kotoba/shared";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRef } from "react";
import { expect, userEvent, within } from "storybook/test";
import { ResultCard } from "@/components/game/result-card";
import { Button } from "@/components/ui/button";

/** 直訳と例文を持つ単語。 */
const fredagsmys: GameResult = {
  outcome: "cleared",
  wordId: "fredagsmys",
  word: "Fredagsmys",
  partOfSpeech: "noun",
  definition:
    "The habit of settling onto the sofa with family or a partner on a Friday night, snacks at hand.",
  literal: "Friday coziness",
  example: {
    sv: "Vad ska vi ha till fredagsmyset?",
    translation: "What are we having for tonight’s cozy night in?",
  },
};

/** 補足を持ち、直訳を持たない単語。 */
const lagom: GameResult = {
  outcome: "gave_up",
  wordId: "lagom",
  word: "Lagom",
  partOfSpeech: "adjective",
  definition: "Just the right amount — neither too much nor too little.",
  note: "It stands for a national preference for moderation, and works as a compliment.",
  example: { sv: "Precis lagom!", translation: "Just right!" },
};

const meta = {
  title: "Game/ResultCard",
  component: ResultCard,
  args: { result: fredagsmys },
  decorators: [
    (Story) => (
      <div className="flex w-full max-w-lg flex-col gap-4 pt-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ResultCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Cleared: Story = {};

export const GaveUp: Story = {
  args: { result: lagom },
};

/** 直訳・補足・例文のどれも持たない単語。品詞と定義だけを組む。 */
export const DefinitionOnly: Story = {
  args: {
    result: {
      outcome: "cleared",
      wordId: "mysig",
      word: "Mysig",
      partOfSpeech: "adjective",
      definition: "An adjective for a warm, comfortable, inviting atmosphere.",
    },
  },
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
