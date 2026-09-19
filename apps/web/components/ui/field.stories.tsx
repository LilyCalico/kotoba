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
      <FieldLabel htmlFor="field-vertical">ニックネーム</FieldLabel>
      <Input id="field-vertical" placeholder="kotoba" />
      <FieldDescription>結果カードに表示されます。</FieldDescription>
    </Field>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <Field orientation="horizontal" className="w-96">
      <FieldLabel htmlFor="field-horizontal">解答</FieldLabel>
      <Input id="field-horizontal" placeholder="fika" />
      <Button>送信</Button>
    </Field>
  ),
};

export const Group: Story = {
  render: () => (
    <FieldSet className="w-80">
      <FieldLegend>プレイ設定</FieldLegend>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="field-group-name">ニックネーム</FieldLabel>
          <Input id="field-group-name" placeholder="kotoba" />
        </Field>
        <FieldSeparator />
        <Field>
          <FieldLabel htmlFor="field-group-hints">ヒントの回数</FieldLabel>
          <Input id="field-group-hints" type="number" defaultValue={3} />
          <FieldDescription>1 ゲームで使えるヒントの上限。</FieldDescription>
        </Field>
      </FieldGroup>
    </FieldSet>
  ),
};
