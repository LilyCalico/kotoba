import { MAX_INPUT_LENGTH } from "@kotoba/shared";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { InputForm } from "@/components/game/input-form";

function Controlled({
  initialValue = "",
  disabled = false,
}: {
  initialValue?: string;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <div className="w-full max-w-lg">
      <InputForm
        disabled={disabled}
        onSubmit={() => setValue("")}
        onValueChange={setValue}
        value={value}
      />
    </div>
  );
}

const meta = {
  title: "Game/InputForm",
  component: InputForm,
  args: {
    value: "",
    onValueChange: () => undefined,
    onSubmit: () => undefined,
  },
} satisfies Meta<typeof InputForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  render: () => <Controlled />,
};

export const Typed: Story = {
  render: () => <Controlled initialValue="Is it something you do at home?" />,
};

export const Sending: Story = {
  render: () => <Controlled disabled initialValue="Is it a feeling?" />,
};

export const NearLimit: Story = {
  render: () => <Controlled initialValue={"a".repeat(MAX_INPUT_LENGTH - 3)} />,
};
