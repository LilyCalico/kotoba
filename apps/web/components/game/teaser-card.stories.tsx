import type { Word } from "@kotoba/shared";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { type ComponentProps, useState } from "react";
import { TeaserCard } from "@/components/game/teaser-card";
import { Button } from "@/components/ui/button";
import { fixtureWord } from "@/lib/game/fixtures";
import { useLocale } from "@/lib/i18n/locale-context";

/** モックの単語の設問を、ツールバーで選んだ言語で描く。 */
function WordTeaserCard({ word, ...props }: { word: Word } & Omit<ComponentProps<typeof TeaserCard>, "teaser">) {
  return <TeaserCard {...props} teaser={word.teaser[useLocale()]} />;
}

const meta = {
  title: "Game/TeaserCard",
  component: WordTeaserCard,
  args: { word: fixtureWord("fredagsmys") },
  decorators: [
    (Story) => (
      <div className="w-full max-w-lg">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WordTeaserCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Floating: Story = {
  args: { variant: "floating" },
};

export const Pinned: Story = {
  args: { variant: "pinned" },
};

/** 設問の提示からチャットへの変形。Toggle を押すたびに Floating と Pinned を行き来する。 */
export const Settle: Story = {
  render: function Render(args) {
    const [floating, setFloating] = useState(true);

    return (
      <div className="flex h-[32rem] flex-col gap-4">
        <Button className="self-start" onPress={() => setFloating((value) => !value)} variant="outline">
          Toggle
        </Button>
        <div className={floating ? "flex flex-1 items-center" : "flex flex-1 items-start"}>
          <WordTeaserCard
            {...args}
            key={floating ? "floating" : "pinned"}
            layoutId="teaser"
            variant={floating ? "floating" : "pinned"}
          />
        </div>
      </div>
    );
  },
};
