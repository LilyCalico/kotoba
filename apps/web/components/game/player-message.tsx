/** ヒントボタンを押したとき、プレイヤーの発言としてログに積む文言。 */
export const HINT_REQUEST_TEXT = "Can I have a hint?";

/**
 * プレイヤーの発言。紺の吹き出しに白い文字で右に寄せ、右下の角だけを尖らせる。
 * この塗りはプレイヤーの発言だけに使い、ボタンやウィンドウと見分けられるようにする。
 */
export function PlayerMessage({ text }: { text: string }) {
  return (
    <p className="ml-auto w-fit max-w-[80%] rounded-[0.875rem] rounded-br-[0.125rem] bg-bubble px-3.5 py-2.5 text-[0.9375rem] leading-snug wrap-anywhere whitespace-pre-wrap text-bubble-foreground">
      {text}
    </p>
  );
}
