import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LOCALES, isLocale } from "@/lib/i18n/locale";
import { messages } from "@/lib/i18n/messages";
import { crimsonText, japaneseFontVariables, pixelifySans, poppins } from "../fonts";
import { Providers } from "../providers";
import "../globals.css";

/** サイト名はどの言語でも「kotoba」のまま、説明を URL の言語で出す。 */
export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  return {
    title: {
      default: "kotoba",
      template: "%s | kotoba",
    },
    description: messages[lang].metadata.description,
  };
}

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
