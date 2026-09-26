import type { Preview } from "@storybook/nextjs-vite";
import { zenMaruGothic } from "../app/fonts";
import { Providers } from "../app/providers";
import "../app/globals.css";

// Storybook は app/layout.tsx を通らないため、<html> に当てる値をここで当てる。
// ダイアログは <body> の直下に描画されるので、story を包む要素ではなく <html> に置く。
document.documentElement.classList.add(zenMaruGothic.variable);
document.documentElement.lang = "en";

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <Providers>
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8 font-sans text-foreground">
          <Story />
        </div>
      </Providers>
    ),
  ],
};

export default preview;
