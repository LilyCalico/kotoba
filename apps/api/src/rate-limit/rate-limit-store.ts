/** レートリミットの窓の長さ。`docs/specifications/api.md`「レートリミット」の「1 分に N 回」の 1 分。 */
export const RATE_LIMIT_WINDOW_MS = 60 * 1000;

/** `at` を含む窓の始まりの時刻。窓は 1 分ちょうどに揃える。 */
export function windowStartOf(at: number): number {
  return Math.floor(at / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS;
}

/**
 * レートリミットのカウンタの保存先。api のほかのコードは保存先を知らない。
 * インスタンスごとに数えるとインスタンスの数だけ上限が増えるため、api は共有ストアの実装を使う。
 */
export interface RateLimitStore {
  /**
   * `key` の、`windowStart` に始まる窓の回数を 1 つ増やし、増やした後の回数を返す。
   * 同時に数えても取りこぼさない。あわせて終わった窓のカウンタを捨てる。
   */
  hit(key: string, windowStart: number): Promise<number>;
}

/** `RateLimitStore` の注入に使うトークン。インターフェースは実行時に残らないため、値で指す。 */
export const RATE_LIMIT_STORE = Symbol("RateLimitStore");

/** 窓を決める現在時刻（ミリ秒）を返す関数の注入に使うトークン。テストで時刻を止めるために差し替える。 */
export const RATE_LIMIT_CLOCK = Symbol("RateLimitClock");
