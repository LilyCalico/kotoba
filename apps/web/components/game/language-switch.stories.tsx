import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { LanguageSwitch } from "@/components/game/language-switch";
import { LOCALES, LOCALE_NAMES, localizedPath } from "@/lib/i18n/locale";
import { storyLocale } from "@/lib/i18n/story-locale";

const meta = {
  title: "Game/LanguageSwitch",
  component: LanguageSwitch,
  decorators: [
    (Story) => (
      <div className="flex w-full max-w-lg justify-end px-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LanguageSwitch>;

export default meta;

type Story = StoryObj<typeof meta>;

/** ツールバーで選んだ言語のスタート画面に置いたとき。もう一方の言語のスタート画面へのリンクを出す。 */
export const Default: Story = {
  play: async ({ canvasElement, globals }) => {
    const locale = storyLocale(globals);
    const canvas = within(canvasElement);

    for (const target of LOCALES.filter((other) => other !== locale)) {
      const { short, name } = LOCALE_NAMES[target];
      const link = canvas.getByRole("link", { name: `${short} ${name}` });
      await expect(link).toHaveAttribute("href", localizedPath(target, "/"));
      await expect(link).toHaveAttribute("hreflang", target);
    }
  },
};
