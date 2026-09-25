import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { GiveUpDialog } from "@/components/game/give-up-dialog";
import { Button } from "@/components/ui/button";

function Trigger() {
  const [isOpen, setOpen] = useState(false);

  return (
    <>
      <Button onPress={() => setOpen(true)} variant="outline">
        Open the give-up dialog
      </Button>
      <GiveUpDialog
        isOpen={isOpen}
        onConfirm={() => setOpen(false)}
        onOpenChange={setOpen}
      />
    </>
  );
}

const meta = {
  title: "Game/GiveUpDialog",
  component: GiveUpDialog,
  args: {
    isOpen: false,
    onOpenChange: () => undefined,
    onConfirm: () => undefined,
  },
} satisfies Meta<typeof GiveUpDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  render: () => <Trigger />,
};

export const Open: Story = {
  render: () => (
    <GiveUpDialog
      isOpen
      onConfirm={() => undefined}
      onOpenChange={() => undefined}
    />
  ),
};
