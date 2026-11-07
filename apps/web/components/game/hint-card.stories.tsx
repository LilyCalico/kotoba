import { MAX_HINTS, type Word } from "@kotoba/shared";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { type ComponentProps, useState } from "react";
import { HintCard } from "@/components/game/hint-card";
import { PlayerMessage } from "@/components/game/player-message";
import { VerdictMessage } from "@/components/game/verdict-message";
import { Button } from "@/components/ui/button";
import { fixtureWord } from "@/lib/game/fixtures";
import { useLocale } from "@/lib/i18n/locale-context";

/** モックの単語の `index` 番目のヒントを、ツールバーで選んだ言語で描く。 */
function WordHintCard({ word, ...props }: { word: Word } & Omit<ComponentProps<typeof HintCard>, "text">) {
  return <HintCard {...props} text={word.hints[useLocale()][props.index - 1] ?? ""} />;
}

/** ヒントの間に挟む、プレイヤーの質問。 */
const QUESTIONS = {
  en: ["Is it a noun?", "Is it something you do on a Friday?"],
  ja: ["名詞？", "金曜日にすること？"],
} as const;

const meta = {
  title: "Game/HintCard",
  component: WordHintCard,
  args: { word: fixtureWord("fredagsmys"), index: 1 },
  decorators: [
    (Story) => (
      <div className="flex w-full max-w-lg flex-col gap-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WordHintCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllThree: Story = {
  render: (args) => (
    <>
      {Array.from({ length: MAX_HINTS }, (_, offset) => (
        <WordHintCard index={offset + 1} key={offset} word={args.word} />
      ))}
    </>
  ),
};

/** 回答バブルと並べ、フル幅・枠線・ラベルで見分けられることを確かめる。 */
export const AmongMessages: Story = {
  render: function Render(args) {
    const [first, second] = QUESTIONS[useLocale()];

    return (
      <>
        <PlayerMessage text={first} />
        <VerdictMessage verdict="yes" />
        <WordHintCard index={1} word={args.word} />
        <PlayerMessage text={second} />
        <VerdictMessage verdict="yes" />
      </>
    );
  },
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
        <WordHintCard {...args} key={count} />
      </>
    );
  },
};
