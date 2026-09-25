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
    "Ask yes-or-no questions to uncover a Swedish word that exists in no other language.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${zenMaruGothic.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
