import type { Preview } from "@storybook/nextjs-vite";
import { I18nProvider } from "react-aria-components";
import { zenMaruGothic } from "../app/fonts";
import { Providers } from "../app/providers";
import "../app/globals.css";

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <Providers>
        {/* コンポーネントと story の文言は英語。React Aria の組み込みラベルも英語に揃える。 */}
        <I18nProvider locale="en">
          <div
            className={`${zenMaruGothic.variable} flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8 font-sans text-foreground`}
            lang="en"
          >
            <Story />
          </div>
        </I18nProvider>
      </Providers>
    ),
  ],
};

export default preview;
