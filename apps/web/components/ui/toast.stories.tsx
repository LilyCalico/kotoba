import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, screen, userEvent, waitFor } from "storybook/test";
import { Button } from "@/components/ui/button";
import { type ToastContent, toast, toastQueue } from "@/components/ui/toast";

function ToastTrigger({ content }: { content: ToastContent }) {
  return (
    <Button onPress={() => toast(content)} variant="outline">
      Show a toast
    </Button>
  );
}

const meta = {
  title: "UI/Toast",
  component: ToastTrigger,
  args: { content: { title: "Couldn't give up. Please try again." } },
  // story ごとにキューを空にし、前の story のスナックバーを持ち越さない。
  beforeEach: () => {
    toastQueue.clear();
  },
  play: async () => {
    await userEvent.click(screen.getByRole("button", { name: "Show a toast" }));
  },
} satisfies Meta<typeof ToastTrigger>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 操作ボタンのないスナックバー。5 秒で自動的に閉じる。 */
export const Default: Story = {};

/** 操作ボタンを添えたスナックバー。自動では閉じず、操作か閉じるボタンで閉じる。 */
export const WithAction: Story = {
  args: {
    content: {
      title: "Couldn't start a game.",
      action: { label: "Retry", onAction: fn() },
    },
  },
};

/** 操作ボタンを押すと、操作を呼んでスナックバーを閉じる。 */
export const PressAction: Story = {
  args: WithAction.args,
  play: async ({ args }) => {
    await userEvent.click(screen.getByRole("button", { name: "Show a toast" }));
    await userEvent.click(await screen.findByRole("button", { name: "Retry" }));

    await expect(args.content.action?.onAction).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByText("Couldn't start a game.")).not.toBeInTheDocument());
  },
};
