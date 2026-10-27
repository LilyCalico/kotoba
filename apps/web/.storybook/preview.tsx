import type { Preview } from "@storybook/nextjs-vite";
import { crimsonText, pixelifySans, poppins } from "../app/fonts";
import { Providers } from "../app/providers";
import "../app/globals.css";

// Storybook は app/layout.tsx を通らないため、<html> に当てる値をここで当てる。
// ダイアログは <body> の直下に描画されるので、story を包む要素ではなく <html> に置く。
document.documentElement.classList.add(poppins.variable, crimsonText.variable, pixelifySans.variable);
document.documentElement.lang = "en";

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    // 画面全体を描く story は `parameters.page: true` を指定し、中央寄せと余白を当てずに描く。
    (Story, { parameters }) => (
      <Providers>
        {parameters.page ? (
          <div className="grid-paper flex min-h-screen flex-col font-sans text-foreground">
            <Story />
          </div>
        ) : (
          <div className="grid-paper flex min-h-screen flex-col items-center justify-center gap-6 p-8 font-sans text-foreground">
            <Story />
          </div>
        )}
      </Providers>
    ),
  ],
};

export default preview;
