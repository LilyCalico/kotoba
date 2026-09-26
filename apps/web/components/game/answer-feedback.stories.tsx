import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AnswerFeedback } from "@/components/game/answer-feedback";
import { PlayerMessage } from "@/components/game/player-message";

const meta = {
  title: "Game/AnswerFeedback",
  component: AnswerFeedback,
  args: { correct: true },
  decorators: [
    (Story) => (
      <div className="flex w-full max-w-lg flex-col gap-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AnswerFeedback>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Correct: Story = {};

export const Incorrect: Story = {
  args: { correct: false },
};

export const RepeatedMisses: Story = {
  render: () => (
    <>
      {["fika", "lagom", "mys"].map((guess) => (
        <div className="contents" key={guess}>
          <PlayerMessage text={guess} />
          <AnswerFeedback correct={false} />
        </div>
      ))}
      <PlayerMessage text="fredagsmys" />
      <AnswerFeedback correct />
    </>
  ),
};
