import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LOCALES, isLocale } from "@/lib/i18n/locale";
import { crimsonText, japaneseFontVariables, pixelifySans, poppins } from "../fonts";
import { Providers } from "../providers";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: "kotoba",
    template: "%s | kotoba",
  },
  description:
    "Ask yes-or-no questions to uncover a Swedish word for a feeling you've never been able to name.",
};

/** UI 言語ごとにページを作り、それ以外の言語のセグメントは 404 にする。 */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export const dynamicParams = false;

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <html
      lang={lang}
      className={`${poppins.variable} ${crimsonText.variable} ${pixelifySans.variable} h-full antialiased`}
      style={lang === "ja" ? japaneseFontVariables : undefined}
    >
      <body className="min-h-full flex flex-col">
        <Providers locale={lang}>{children}</Providers>
      </body>
    </html>
  );
}
