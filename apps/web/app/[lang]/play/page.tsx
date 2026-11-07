import type { Metadata } from "next";

import { PlayScreen } from "@/components/game/play-screen";
import { isLocale } from "@/lib/i18n/locale";
import { messages } from "@/lib/i18n/messages";

export async function generateMetadata({ params }: PageProps<"/[lang]/play">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  return { title: messages[lang].metadata.playTitle };
}

export default function Play() {
  return <PlayScreen />;
}
