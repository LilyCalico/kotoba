import type { ErrorCode } from "@kotoba/shared";

/** `code` ごとの HTTP ステータス。`docs/specifications/api.md`「エラー」の表に従う。 */
export const STATUS_BY_CODE = {
  validation_error: 400,
  game_not_found: 404,
  game_finished: 409,
  hint_out_of_order: 409,
  hint_limit_reached: 409,
  rate_limited: 429,
  internal_error: 500,
  ai_unavailable: 503,
  ai_rate_limited: 503,
} as const satisfies Record<ErrorCode, number>;

/**
 * クライアントに `code` 付きで返す失敗。例外フィルターが Problem Details に変換する。
 * `detail` はそのまま応答に載るため、単語や履歴などの秘密を書かない。
 * `retryAfterSeconds` は `Retry-After` ヘッダーで返す、送り直すまでに待つ秒数。
 */
export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly detail?: string,
    readonly retryAfterSeconds?: number,
  ) {
    super(detail ?? code);
    this.name = "ApiError";
  }

  get status(): number {
    return STATUS_BY_CODE[this.code];
  }
}
