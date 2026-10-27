import type { Metadata } from "next";
import { crimsonText, pixelifySans, poppins } from "./fonts";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "kotoba",
    template: "%s | kotoba",
  },
  description:
    "Ask yes-or-no questions to uncover a Swedish word for a feeling you've never been able to name.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} ${crimsonText.variable} ${pixelifySans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
