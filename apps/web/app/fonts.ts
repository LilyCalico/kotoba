import { Crimson_Text, DotGothic16, Klee_One, Pixelify_Sans, Poppins, Zen_Maru_Gothic } from "next/font/google";

/** UI の書体。回答・入力・説明文・吹き出しなど、操作と短い文に使う。 */
export const poppins = Poppins({
  variable: "--font-sans",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

/** 読ませる文の書体。設問・ヒント・正解の単語と定義に使う。 */
export const crimsonText = Crimson_Text({
  variable: "--font-serif",
  weight: ["400", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

/** 画面の部品の書体。ワードマーク・ウィンドウのタイトルバー・ボタン・起動画面の文字に使う。 */
export const pixelifySans = Pixelify_Sans({
  variable: "--font-pixel",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

// 日本語の書体。字ごとの小さなファイルに分かれていて、ページで使う字の分だけ読み込まれる。
// 英語の画面では日本語の字を使わないため読み込まれない。先読みすると全ページで読み込むため、しない。

/** 日本語の UI の書体。Poppins の役割を受け持つ。 */
const zenMaruGothic = Zen_Maru_Gothic({ weight: ["400", "500", "700"], preload: false });

/** 日本語の読ませる文の書体。Crimson Text の役割を受け持つ。 */
const kleeOne = Klee_One({ weight: ["400", "600"], preload: false });

/** 日本語の部品の書体。Pixelify Sans の役割を受け持つ。 */
const dotGothic16 = DotGothic16({ weight: "400", preload: false });

/**
 * 英字の書体の並び（「Poppins, Poppins Fallback」）の、代替の書体の前に日本語の書体を差し込む。
 * 代替の書体は端末の書体（Arial など）で、日本語の字を端末の書体で埋めてしまうため、日本語の書体より後ろに置く。
 */
function withJapanese(latin: { style: { fontFamily: string } }, japanese: { style: { fontFamily: string } }): string {
  const [primary, ...fallbacks] = latin.style.fontFamily.split(",").map((family) => family.trim());
  return [primary, japanese.style.fontFamily, ...fallbacks].join(", ");
}

/**
 * 日本語の画面で `<html>` に当てる書体の変数。英字は英語の画面と同じ書体で出し、日本語の字だけを日本語の書体で出す。
 * `next/font` の `variable` のクラスより後に効かせるため、`style` で当てる。
 */
export const japaneseFontVariables = {
  "--font-sans": withJapanese(poppins, zenMaruGothic),
  "--font-serif": withJapanese(crimsonText, kleeOne),
  "--font-pixel": withJapanese(pixelifySans, dotGothic16),
} as React.CSSProperties;
