/** ヒントボタンを押したとき、プレイヤーの発言としてログに積む文言。 */
export const HINT_REQUEST_TEXT = "Can I have a hint?";

export function PlayerMessage({ text }: { text: string }) {
  return (
    <p className="ml-auto w-fit max-w-[85%] rounded-md bg-secondary px-4 py-2 text-sm wrap-anywhere whitespace-pre-wrap text-secondary-foreground">
      {text}
    </p>
  );
}
