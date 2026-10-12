import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const meta = {
  title: "UI/Dialog",
  component: Dialog,
  args: { children: null },
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DialogTrigger>
      <Button variant="outline">How to play</Button>
      <Dialog>
        <DialogHeader>
          <DialogTitle>How to play</DialogTitle>
          <DialogDescription>
            Ask yes-or-no questions to uncover the hidden word.
            You can use up to 3 hints per game.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose>Close</DialogClose>
        </DialogFooter>
      </Dialog>
    </DialogTrigger>
  ),
};

export const WithoutCloseButton: Story = {
  render: () => (
    <DialogTrigger>
      <Button>See the result</Button>
      <Dialog showCloseButton={false} isDismissable={false}>
        <DialogHeader>
          <DialogTitle>The word was fika</DialogTitle>
          <DialogDescription>
            The Swedish habit of pausing for coffee and something sweet.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose variant="default">Play again</DialogClose>
        </DialogFooter>
      </Dialog>
    </DialogTrigger>
  ),
};
