import { Zen_Maru_Gothic } from "next/font/google";

/**
 * 和文・欧文をまかなう唯一の書体。`--font-sans` として公開し、Tailwind の
 * `font-sans` から参照する。
 *
 * Zen Maru Gothic は可変フォントではないため、使うウェイトを明示する。`subsets` は
 * プリロードする範囲の指定であり、日本語のグリフは unicode-range で分割された
 * 別ファイルとして self-host され、必要になった時点で読み込まれる。
 */
export const zenMaruGothic = Zen_Maru_Gothic({
  variable: "--font-sans",
  weight: ["400", "700"],
  subsets: ["latin"],
});
