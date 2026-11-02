import type { Metadata } from "next";

import { PlayScreen } from "@/components/game/play-screen";

export const metadata: Metadata = {
  title: "Play",
};

export default function Play() {
  return <PlayScreen />;
}
