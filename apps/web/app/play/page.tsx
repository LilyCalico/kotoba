import { PlayScreen } from "@/components/game/play-screen";

export const metadata = {
  title: "Play",
};

export default async function Play({ searchParams }: PageProps<"/play">) {
  const { word } = await searchParams;

  return <PlayScreen wordId={typeof word === "string" ? word : undefined} />;
}
