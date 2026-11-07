import type { UiLocale } from "@kotoba/shared";
import type { Preview } from "@storybook/nextjs-vite";
import { crimsonText, japaneseFontVariables, pixelifySans, poppins } from "../app/fonts";
import { Providers } from "../app/providers";
import { DEFAULT_LOCALE } from "../lib/i18n/locale";
import { storyLocale } from "../lib/i18n/story-locale";
import "../app/globals.css";

// Storybook は app/[lang]/layout.tsx を通らないため、<html> に当てる値をここで当てる。
// ダイアログは <body> の直下に描画されるので、story を包む要素ではなく <html> に置く。
document.documentElement.classList.add(poppins.variable, crimsonText.variable, pixelifySans.variable);

/** ページのレイアウトと同じく、UI 言語を `<html>` の `lang` に当て、日本語の画面では日本語の書体の変数を当てる。 */
function applyLocaleToDocument(locale: UiLocale) {
  const root = document.documentElement;
  root.lang = locale;
  for (const [name, value] of Object.entries(japaneseFontVariables)) {
    if (locale === "ja") root.style.setProperty(name, String(value));
    else root.style.removeProperty(name);
  }
}

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
  },
  globalTypes: {
    locale: {
      description: "UI 言語",
      toolbar: {
        title: "Locale",
        icon: "globe",
        items: [
          { value: "en", title: "English" },
          { value: "ja", title: "日本語" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    locale: DEFAULT_LOCALE,
  },
  decorators: [
    // 画面全体を描く story は `parameters.page: true` を指定し、中央寄せと余白を当てずに描く。
    (Story, { parameters, globals }) => {
      const locale = storyLocale(globals);
      applyLocaleToDocument(locale);

      return (
        <Providers locale={locale}>
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
      );
    },
  ],
};

export default preview;
