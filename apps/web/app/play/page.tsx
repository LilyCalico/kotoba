import type { Metadata } from "next";

import { PlayScreen } from "@/components/game/play-screen";

export const metadata: Metadata = {
  title: "Play",
};

/** `?word=<id>` が 1 つだけ指定されたときに限り、出題単語を固定する。 */
export default async function Play({ searchParams }: PageProps<"/play">) {
  const { word } = await searchParams;
  return <PlayScreen wordId={typeof word === "string" ? word : undefined} />;
}
