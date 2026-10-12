import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const meta = {
  title: "UI/Field",
  component: Field,
} satisfies Meta<typeof Field>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Vertical: Story = {
  render: () => (
    <Field className="w-80">
      <FieldLabel htmlFor="field-vertical">Nickname</FieldLabel>
      <Input id="field-vertical" placeholder="kotoba" />
      <FieldDescription>Shown on the result card.</FieldDescription>
    </Field>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <Field orientation="horizontal" className="w-96">
      <FieldLabel htmlFor="field-horizontal">Guess</FieldLabel>
      <Input id="field-horizontal" placeholder="fika" />
      <Button>Send</Button>
    </Field>
  ),
};

export const Group: Story = {
  render: () => (
    <FieldSet className="w-80">
      <FieldLegend>Play settings</FieldLegend>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="field-group-name">Nickname</FieldLabel>
          <Input id="field-group-name" placeholder="kotoba" />
        </Field>
        <FieldSeparator />
        <Field>
          <FieldLabel htmlFor="field-group-hints">Number of hints</FieldLabel>
          <Input id="field-group-hints" type="number" defaultValue={3} />
          <FieldDescription>The most hints you can use in one game.</FieldDescription>
        </Field>
      </FieldGroup>
    </FieldSet>
  ),
};
