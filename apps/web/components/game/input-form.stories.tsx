import { MAX_INPUT_LENGTH } from "@kotoba/shared";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { INPUT_LABEL, InputForm } from "@/components/game/input-form";

const meta = {
  title: "Game/InputForm",
  component: InputForm,
  args: {
    value: "",
    onValueChange: fn(),
    onSubmit: fn(),
    disabled: false,
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-lg">
        <Story />
      </div>
    ),
  ],
  render: function Render(args) {
    const [value, setValue] = useState(args.value);

    return (
      <InputForm
        {...args}
        onSubmit={(text) => {
          args.onSubmit(text);
          setValue("");
        }}
        onValueChange={(next) => {
          args.onValueChange(next);
          setValue(next);
        }}
        value={value}
      />
    );
  },
} satisfies Meta<typeof InputForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Typing: Story = {
  args: { value: "Is it something you do at home?" },
};

/** 上限ちょうどまで入れた状態。201 字目は入らない。 */
export const AtLimit: Story = {
  args: { value: "a".repeat(MAX_INPUT_LENGTH) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: INPUT_LABEL });

    await userEvent.type(input, "b");

    await expect(input).toHaveValue("a".repeat(MAX_INPUT_LENGTH));
    await expect(canvas.getByText("0 characters left")).toBeInTheDocument();
  },
};

export const Sending: Story = {
  args: { value: "Is it a feeling?", disabled: true },
};

/** 空白だけの入力は、ボタンでも Enter でも送れない。 */
export const WhitespaceOnly: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: INPUT_LABEL });

    await userEvent.type(input, "   {Enter}");

    await expect(canvas.getByRole("button", { name: "Send" })).toBeDisabled();
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

/** 送る文字列は前後の空白を落とす。 */
export const Submit: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByRole("textbox", { name: INPUT_LABEL }), "  Is it a noun?  {Enter}");

    await expect(args.onSubmit).toHaveBeenCalledWith("Is it a noun?");
  },
};
