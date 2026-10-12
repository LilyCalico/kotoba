import type { Metadata } from "next";
import { zenMaruGothic } from "./fonts";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "kotoba",
    template: "%s | kotoba",
  },
  description:
    "はい / いいえ で質問して、スウェーデン語の「その言語にしかない言葉」を当てるゲーム。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${zenMaruGothic.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
