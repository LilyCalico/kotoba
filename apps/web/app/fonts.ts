import { Crimson_Text, Pixelify_Sans, Poppins } from "next/font/google";

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
