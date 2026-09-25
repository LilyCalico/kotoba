import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ResultCard } from "@/components/game/result-card";

const DEFINITION =
  "The habit of settling onto the sofa with family or a partner on a Friday night, snacks at hand.";

const meta = {
  title: "Game/ResultCard",
  component: ResultCard,
  args: {
    result: {
      outcome: "cleared",
      word: "Fredagsmys",
      definition: DEFINITION,
    },
  },
} satisfies Meta<typeof ResultCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Cleared: Story = {
  render: (args) => (
    <div className="w-full max-w-lg">
      <ResultCard {...args} />
    </div>
  ),
};

export const GaveUp: Story = {
  args: {
    result: { outcome: "gave_up", word: "Fredagsmys", definition: DEFINITION },
  },
  render: (args) => (
    <div className="w-full max-w-lg">
      <ResultCard {...args} headingId="result-heading-gave-up" />
    </div>
  ),
};
