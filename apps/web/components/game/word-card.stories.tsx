import type { Word } from "@kotoba/shared";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { type ComponentProps, useState } from "react";
import { expect, within } from "storybook/test";
import { WordCard } from "@/components/game/word-card";
import { Button } from "@/components/ui/button";
import { fixtureWord } from "@/lib/game/fixtures";
import { storyMessages } from "@/lib/i18n/story-locale";

/** モックの単語の綴りと読みで描く。 */
function FixtureWordCard({
  word,
  ...props
}: { word: Word } & Omit<ComponentProps<typeof WordCard>, "word" | "reading">) {
  return <WordCard {...props} reading={word.reading} word={word.word} />;
}

/** 意味当ては日本語の UI でだけ遊ぶため、既定の言語を日本語にする。 */
const meta = {
  title: "Game/WordCard",
  component: FixtureWordCard,
  args: { word: fixtureWord("lagom") },
  globals: { locale: "ja" },
  decorators: [
    (Story) => (
      <div className="w-full max-w-lg">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FixtureWordCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Floating: Story = {
  args: { variant: "floating" },
  play: async ({ args, canvasElement, globals }) => {
    const t = storyMessages(globals).wordCard;
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("region", { name: t.title })).toBeVisible();
    await expect(canvas.getByText(args.word.word)).toHaveAttribute("lang", "sv");
    await expect(canvas.getByText(args.word.reading)).toBeVisible();
    await expect(canvas.getByText(t.prompt)).toBeVisible();
  },
};

export const Pinned: Story = {
  args: { variant: "pinned" },
  play: async ({ args, canvasElement, globals }) => {
    const t = storyMessages(globals).wordCard;
    const canvas = within(canvasElement);

    await expect(canvas.getByText(args.word.word)).toBeVisible();
    await expect(canvas.queryByText(t.prompt)).toBeNull();
  },
};

/** seed で最も長い単語。ゲーム開始時の様式では、カードの幅に収まるまで文字を小さくする。 */
export const LongWord: Story = {
  args: { variant: "floating" },
  render: (args) => <WordCard {...args} reading="アッレマンスレッテン" word="Allemansrätten" />,
};

/** 長い単語のチャットの様式。読みが収まらなければ次の行へ回る。 */
export const LongWordPinned: Story = {
  args: { variant: "pinned" },
  render: (args) => <WordCard {...args} reading="アッレマンスレッテン" word="Allemansrätten" />,
};

/** ゲーム開始からチャットへの変形。Toggle を押すたびに Floating と Pinned を行き来する。 */
export const Settle: Story = {
  render: function Render(args) {
    const [floating, setFloating] = useState(true);

    return (
      <div className="flex h-[32rem] flex-col gap-4">
        <Button className="self-start" onPress={() => setFloating((value) => !value)} variant="outline">
          Toggle
        </Button>
        <div className={floating ? "flex flex-1 items-center" : "flex flex-1 items-start"}>
          <FixtureWordCard
            {...args}
            key={floating ? "floating" : "pinned"}
            layoutId="word"
            variant={floating ? "floating" : "pinned"}
          />
        </div>
      </div>
    );
  },
};
