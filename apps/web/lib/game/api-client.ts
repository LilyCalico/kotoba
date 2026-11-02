import { problemSchema } from "@kotoba/shared";
import type { ClientOptions } from "openapi-fetch";

import { createApiClient } from "@/lib/api/client";

import { type GameClient, GameClientError } from "./client";

type ApiResult<T> = { data?: T; error?: unknown; response: Response };

/** `Retry-After` の秒数。ヘッダーがない、または秒数の形でなければ `undefined`。 */
function retryAfterOf(response: Response): number | undefined {
  const value = response.headers.get("Retry-After");
  return value !== null && /^\d+$/.test(value) ? Number(value) : undefined;
}

/**
 * 応答から成功時の本文を取り出す。失敗はすべて `GameClientError` にする。
 *
 * - 失敗の本文が Problem Details として読めれば、その `code`。`Retry-After` があればその秒数も持たせる
 * - 通信の失敗、成功なのに本文が JSON として読めない応答、Problem Details として読めない失敗
 *   （Vercel のエラーページなど）は `network_error`
 */
async function unwrap<T>(call: () => Promise<ApiResult<T>>): Promise<T> {
  let result: ApiResult<T>;
  try {
    result = await call();
  } catch (error) {
    throw new GameClientError("network_error", "The API could not be reached.", { cause: error });
  }

  const { data, error, response } = result;
  if (response.ok && data !== undefined) return data;

  const problem = problemSchema.safeParse(error);
  if (problem.success) {
    throw new GameClientError(problem.data.code, problem.data.detail, {
      retryAfterSeconds: retryAfterOf(response),
    });
  }
  throw new GameClientError("network_error", `Unexpected response: ${response.status}`);
}

/**
 * `apps/api` を叩く `GameClient`。web と api は同一ホストに載るため、既定では相対パス `/api/v1` を呼ぶ。
 * `options` はテストで `fetch` と `baseUrl` を差し替えるために使う。
 */
export function createApiGameClient(options: ClientOptions = {}): GameClient {
  const api = createApiClient(options);

  return {
    startGame(request) {
      return unwrap(() => api.POST("/api/v1/games", { body: request }));
    },

    sendInput(gameId, input) {
      return unwrap(() =>
        api.POST("/api/v1/games/{gameId}/inputs", { params: { path: { gameId } }, body: input }),
      );
    },

    revealHint(gameId, index) {
      return unwrap(() =>
        api.POST("/api/v1/games/{gameId}/hints", {
          params: { path: { gameId } },
          body: { index },
        }),
      );
    },

    giveUp(gameId) {
      return unwrap(() =>
        api.POST("/api/v1/games/{gameId}/give-up", { params: { path: { gameId } } }),
      );
    },
  };
}
