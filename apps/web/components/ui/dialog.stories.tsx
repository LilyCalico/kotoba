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
      <Button variant="outline">遊び方を見る</Button>
      <Dialog>
        <DialogHeader>
          <DialogTitle>遊び方</DialogTitle>
          <DialogDescription>
            はい / いいえ で答えられる質問を重ねて、隠された言葉を当てます。
            ヒントは 1 ゲームにつき 3 回まで使えます。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose>閉じる</DialogClose>
        </DialogFooter>
      </Dialog>
    </DialogTrigger>
  ),
};

export const WithoutCloseButton: Story = {
  render: () => (
    <DialogTrigger>
      <Button>結果を見る</Button>
      <Dialog showCloseButton={false} isDismissable={false}>
        <DialogHeader>
          <DialogTitle>正解は fika でした</DialogTitle>
          <DialogDescription>
            コーヒーと甘いものを囲んで一息つく、スウェーデンの習慣。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose variant="default">もう一度遊ぶ</DialogClose>
        </DialogFooter>
      </Dialog>
    </DialogTrigger>
  ),
};
