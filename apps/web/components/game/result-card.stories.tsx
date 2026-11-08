import { type Outcome, type Word, gameResultOf } from "@kotoba/shared";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { type ComponentProps, useRef } from "react";
import { expect, userEvent, within } from "storybook/test";
import { ResultCard } from "@/components/game/result-card";
import { Button } from "@/components/ui/button";
import { fixtureWord } from "@/lib/game/fixtures";
import { useLocale } from "@/lib/i18n/locale-context";
import { storyGameMode, storyMessages } from "@/lib/i18n/story-locale";

/** モックの単語の結果を、ツールバーで選んだ言語で組んで描く。日本語では読みが付く。 */
function WordResultCard({
  word,
  outcome,
  ...props
}: { word: Word; outcome: Outcome } & Omit<ComponentProps<typeof ResultCard>, "result">) {
  return <ResultCard {...props} result={gameResultOf(word, outcome, useLocale())} />;
}

/** 直訳と例文を持つ単語。 */
const fredagsmys = fixtureWord("fredagsmys");

/** 補足を持ち、直訳を持たない単語。 */
const lagom = fixtureWord("lagom");

/** 直訳・補足・例文のどれも持たない単語。 */
const definitionOnly: Word = {
  ...fixtureWord("mangata"),
  literal: undefined,
  note: undefined,
  example: undefined,
};

const meta = {
  title: "Game/ResultCard",
  component: WordResultCard,
  args: { word: fredagsmys, outcome: "cleared" },
  decorators: [
    (Story) => (
      <div className="flex w-full max-w-lg flex-col gap-4 pt-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WordResultCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Cleared: Story = {};

export const GaveUp: Story = {
  args: { word: lagom, outcome: "gave_up" },
};

/** 直訳・補足・例文のどれも持たない単語。品詞と定義だけを組む。 */
export const DefinitionOnly: Story = {
  args: { word: definitionOnly },
};

/** ゲーム終了時と同じく、`ref` 経由で見出しへフォーカスを移す。 */
export const FocusHeading: Story = {
  render: function Render(args) {
    const headingRef = useRef<HTMLHeadingElement>(null);

    return (
      <>
        <Button onPress={() => headingRef.current?.focus()}>Focus the heading</Button>
        <WordResultCard {...args} ref={headingRef} />
      </>
    );
  },
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("button", { name: "Focus the heading" }));

    await expect(canvas.getByRole("heading", { name: storyMessages(globals).result.heading.cleared[storyGameMode(globals)] })).toHaveFocus();
  },
};
