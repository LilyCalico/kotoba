import { Crimson_Text, Poppins } from "next/font/google";

/** UI の書体。ボタン・ラベル・入力・回答など、操作と短い文に使う。 */
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
