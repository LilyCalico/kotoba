import type { Preview } from "@storybook/nextjs-vite";
import { zenMaruGothic } from "../app/fonts";
import { Providers } from "../app/providers";
import "../app/globals.css";

/**
 * story を本番と同じ条件で描く。アプリのルートと同じプロバイダ・フォント・
 * デザイントークンを当てるため、story 側で配色や書体を指定する必要はない。
 */
const preview: Preview = {
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <Providers>
        <div
          className={`${zenMaruGothic.variable} flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8 font-sans text-foreground`}
        >
          <Story />
        </div>
      </Providers>
    ),
  ],
};

export default preview;
