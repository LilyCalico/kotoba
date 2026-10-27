/** 起動画面のパソコンに打ち込む文。1 行目と 2 行目を改行で分ける。 */
export const BOOT_TEXT = "Hej hej!\nJag heter Kotoba";

/** 起動画面を見たことを記録するキー。 */
export const BOOT_SEEN_KEY = "kotoba:boot-seen";

/** 画面が出てから 1 文字目を打つまでの間。 */
export const BOOT_START_DELAY_MS = 500;

/** 打ち終えてからスタート画面へ移るまでの間。動きを減らす設定で、文を最初から全部出すときもこの間だけ見せる。 */
export const BOOT_HOLD_MS = 900;

/** 文の区切り（「!」と改行）のあとに置く間。 */
const PAUSE_MS = 420;

/**
 * 1 文字を打つまでの間。人が打つように揺らし、文の区切りのあとでは長めに止まる。
 * `previous` は直前に打った文字、`random` は 0 以上 1 未満の値（`Math.random()`）。
 */
export function keystrokeDelay(previous: string, random: number): number {
  if (previous === "!" || previous === "\n") return PAUSE_MS;
  return 70 + Math.floor(random * 70);
}

/**
 * 起動画面を見たかの記録を読み書きする口。`window.sessionStorage` をそのまま渡せる。
 * `null` は `window` の無い環境を表し、読み書きを行わず「まだ見ていない」として振る舞う。
 */
export type BootStorage = Pick<Storage, "getItem" | "setItem">;

/** ブラウザの `sessionStorage` を返す。`window` が無い、またはアクセスを拒まれたときは `null`。 */
export function getSessionStorage(): BootStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * このタブで起動画面を見たか。サイトを開いたときに 1 回だけ見せ、Play again で戻ったときは見せない。
 * 読めなかったときは見ていないものとして扱う。
 */
export function hasSeenBoot(storage: BootStorage | null): boolean {
  try {
    return storage?.getItem(BOOT_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

/** 起動画面を見たことを記録する。書き込めなかったときは記録を諦め、次も起動画面を見せる。 */
export function markBootSeen(storage: BootStorage | null): void {
  try {
    storage?.setItem(BOOT_SEEN_KEY, "1");
  } catch {
    // 容量超過やプライベートブラウズでの拒否。起動画面がもう一度出るだけで、遊べなくはならない。
  }
}
