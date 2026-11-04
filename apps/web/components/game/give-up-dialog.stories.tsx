import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn, screen, userEvent, waitFor } from "storybook/test";
import { GiveUpDialog } from "@/components/game/give-up-dialog";
import { Button } from "@/components/ui/button";
import { en } from "@/lib/i18n/messages";

const meta = {
  title: "Game/GiveUpDialog",
  component: GiveUpDialog,
  args: {
    isOpen: true,
    onOpenChange: fn(),
    onConfirm: fn(),
  },
  render: function Render(args) {
    const [isOpen, setOpen] = useState(args.isOpen);

    return (
      <>
        <Button onPress={() => setOpen(true)} variant="outline">
          Open the give-up dialog
        </Button>
        <GiveUpDialog
          isOpen={isOpen}
          onConfirm={() => {
            args.onConfirm();
            setOpen(false);
          }}
          onOpenChange={(next) => {
            args.onOpenChange(next);
            setOpen(next);
          }}
        />
      </>
    );
  },
} satisfies Meta<typeof GiveUpDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {};

/** Tab はダイアログの中を巡り、Esc は閉じるだけでギブアップを確定しない。 */
export const KeyboardOnly: Story = {
  play: async ({ args }) => {
    const dialog = await screen.findByRole("dialog", { name: en.giveUpDialog.title });
    const cancel = screen.getByRole("button", { name: en.giveUpDialog.cancel });
    const giveUp = screen.getByRole("button", { name: en.giveUpDialog.confirm });

    for (let press = 0; press < 4; press++) {
      await userEvent.tab();
      await expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
    await expect([cancel, giveUp]).toContain(document.activeElement);

    await userEvent.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
    await expect(args.onConfirm).not.toHaveBeenCalled();
  },
};

/** Give up で確定する。 */
export const Confirm: Story = {
  play: async ({ args }) => {
    await userEvent.click(await screen.findByRole("button", { name: en.giveUpDialog.confirm }));

    await expect(args.onConfirm).toHaveBeenCalledOnce();
  },
};

/** ギブアップの要求中。Give up を押しても確定を重ねない。 */
export const Pending: Story = {
  args: { isPending: true },
  render: (args) => <GiveUpDialog {...args} />,
  play: async ({ args }) => {
    await userEvent.click(await screen.findByRole("button", { name: en.giveUpDialog.confirm }));

    await expect(args.onConfirm).not.toHaveBeenCalled();
  },
};
