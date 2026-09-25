import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AnswerFeedback } from "@/components/game/answer-feedback";

const meta = {
  title: "Game/AnswerFeedback",
  component: AnswerFeedback,
  args: { correct: false },
} satisfies Meta<typeof AnswerFeedback>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Incorrect: Story = {};

export const Correct: Story = {
  args: { correct: true },
};

export const RepeatedMisses: Story = {
  render: () => (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <AnswerFeedback correct={false} />
      <AnswerFeedback correct={false} />
      <AnswerFeedback correct />
    </div>
  ),
};
