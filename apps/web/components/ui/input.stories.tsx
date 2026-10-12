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
  args: { placeholder: "Ask a question or guess the word" },
  render: (args) => (
    <div className="w-80">
      <Input {...args} />
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <Field className="w-80">
      <FieldLabel htmlFor="input-question">Question or guess</FieldLabel>
      <Input id="input-question" placeholder="Is it tied to Fridays?" />
      <FieldDescription>
        Ask something that can be answered with yes or no.
      </FieldDescription>
    </Field>
  ),
};

export const Invalid: Story = {
  render: () => (
    <Field className="w-80" data-invalid>
      <FieldLabel htmlFor="input-invalid">Question or guess</FieldLabel>
      <Input id="input-invalid" aria-invalid defaultValue={"a".repeat(12)} />
      <FieldError>Keep it within 200 characters.</FieldError>
    </Field>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Field className="w-80" data-disabled="true">
      <FieldLabel htmlFor="input-disabled">Question or guess</FieldLabel>
      <Input id="input-disabled" placeholder="Game over" disabled />
    </Field>
  ),
};
