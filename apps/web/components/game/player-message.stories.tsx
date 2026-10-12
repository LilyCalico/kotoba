import { MAX_INPUT_LENGTH } from "@kotoba/shared";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HINT_REQUEST_TEXT, PlayerMessage } from "@/components/game/player-message";

const LONG_TEXT =
  "Is it something that people in Sweden usually do together at home on a Friday evening after a long week, maybe with snacks, candy, tacos or a movie, instead of going out to a restaurant or a bar in town?".slice(
    0,
    MAX_INPUT_LENGTH,
  );

const meta = {
  title: "Game/PlayerMessage",
  component: PlayerMessage,
  args: { text: "Is it a noun?" },
  decorators: [
    (Story) => (
      <div className="flex w-full max-w-lg flex-col gap-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PlayerMessage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Short: Story = {};

export const MaxLength: Story = {
  args: { text: LONG_TEXT },
};

export const UnbrokenWord: Story = {
  args: { text: "Fredagsmys".repeat(20) },
};

export const HintRequest: Story = {
  args: { text: HINT_REQUEST_TEXT },
};
