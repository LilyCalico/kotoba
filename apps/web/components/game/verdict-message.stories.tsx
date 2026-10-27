import { verdictSchema } from "@kotoba/shared";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { UnsupportedLanguageMessage, VerdictMessage } from "@/components/game/verdict-message";

const meta = {
  title: "Game/VerdictMessage",
  component: VerdictMessage,
  args: { verdict: "yes" },
  decorators: [
    (Story) => (
      <div className="flex w-full max-w-lg flex-col gap-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof VerdictMessage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllVerdicts: Story = {
  render: () => (
    <>
      {verdictSchema.options.map((verdict) => (
        <VerdictMessage key={verdict} verdict={verdict} />
      ))}
    </>
  ),
};

/** 日本語・英語・スウェーデン語以外の入力への案内。 */
export const UnsupportedLanguage: Story = {
  render: () => <UnsupportedLanguageMessage />,
};
