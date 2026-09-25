import type { Verdict } from "@kotoba/shared";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { VerdictMessage } from "@/components/game/verdict-message";

const VERDICTS: Verdict[] = [
  "yes",
  "no",
  "unclear",
  "irrelevant",
  "not_a_question",
];

const meta = {
  title: "Game/VerdictMessage",
  component: VerdictMessage,
  args: { verdict: "yes" },
} satisfies Meta<typeof VerdictMessage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllVerdicts: Story = {
  render: () => (
    <div className="flex w-full max-w-lg flex-col gap-3">
      {VERDICTS.map((verdict) => (
        <VerdictMessage key={verdict} verdict={verdict} />
      ))}
    </div>
  ),
};
