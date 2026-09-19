import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const meta = {
  title: "UI/Input",
  component: Input,
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: "質問か解答を入力" },
  render: (args) => (
    <div className="w-80">
      <Input {...args} />
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <Field className="w-80">
      <FieldLabel htmlFor="input-question">質問か解答</FieldLabel>
      <Input id="input-question" placeholder="金曜日に限った言葉ですか？" />
      <FieldDescription>
        はい / いいえ で答えられる質問にしてください。
      </FieldDescription>
    </Field>
  ),
};

export const Invalid: Story = {
  render: () => (
    <Field className="w-80" data-invalid>
      <FieldLabel htmlFor="input-invalid">質問か解答</FieldLabel>
      <Input id="input-invalid" aria-invalid defaultValue={"あ".repeat(12)} />
      <FieldError>200 文字以内で入力してください。</FieldError>
    </Field>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Field className="w-80" data-disabled="true">
      <FieldLabel htmlFor="input-disabled">質問か解答</FieldLabel>
      <Input id="input-disabled" placeholder="ゲーム終了" disabled />
    </Field>
  ),
};
