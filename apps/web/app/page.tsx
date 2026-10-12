import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <h1>
        <Image
          src="/kotoba-logo.png"
          alt="kotoba"
          width={220}
          height={66}
          priority
        />
      </h1>
      <p className="max-w-80 text-center text-sm text-muted-foreground">
        はい / いいえ で質問して、スウェーデン語の「その言語にしかない言葉」を当てるゲーム。
      </p>
    </main>
  );
}
