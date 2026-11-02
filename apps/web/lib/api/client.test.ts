import { describe, expect, it } from "vitest";

import { type ApiClient, createApiClient } from "./client";

const GAME_ID = "4f0e8c4e-6a43-4c5e-9d6a-2b9c7a3e1f00";

/** 受け取ったリクエストを記録し、決まった応答を返す fetch。 */
function fakeFetch(status: number, body: unknown, contentType = "application/json") {
  const requests: Request[] = [];
  const fetch = async (request: Request) => {
    requests.push(request);
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": contentType } });
  };
  return { fetch, requests };
}

describe("createApiClient", () => {
  it("パスパラメーターと本文から、API 仕様どおりのリクエストを組み立てる", async () => {
    const { fetch, requests } = fakeFetch(200, { kind: "question", verdict: "unclear" });
    const client = createApiClient({ baseUrl: "http://localhost", fetch });

    const { data } = await client.POST("/api/v1/games/{gameId}/inputs", {
      params: { path: { gameId: GAME_ID } },
      body: { text: "Is it a feeling?" },
    });

    expect(data).toEqual({ kind: "question", verdict: "unclear" });
    const [request] = requests;
    expect(request?.method).toBe("POST");
    expect(request?.url).toBe(`http://localhost/api/v1/games/${GAME_ID}/inputs`);
    expect(await request?.json()).toEqual({ text: "Is it a feeling?" });
  });

  it("失敗は Problem Details として error に入る", async () => {
    const problem = { type: "about:blank", title: "Not Found", status: 404, code: "game_not_found" };
    const { fetch } = fakeFetch(404, problem, "application/problem+json");
    const client = createApiClient({ baseUrl: "http://localhost", fetch });

    const { data, error } = await client.POST("/api/v1/games/{gameId}/give-up", {
      params: { path: { gameId: GAME_ID } },
    });

    expect(data).toBeUndefined();
    expect(error?.code).toBe("game_not_found");
  });
});

/**
 * 型だけを確かめる。呼び出さず、`pnpm typecheck` が誤りを型エラーとして検出することを見る。
 * `@ts-expect-error` の行が型エラーにならなくなると、typecheck が落ちる。
 */
export function typeChecks(client: ApiClient) {
  // @ts-expect-error 仕様にないパスは呼べない
  void client.POST("/api/v1/games/unknown");
  // @ts-expect-error ゲーム開始は GET を持たない
  void client.GET("/api/v1/games");
  void client.POST("/api/v1/games/{gameId}/inputs", {
    params: { path: { gameId: GAME_ID } },
    // @ts-expect-error 入力の本文は text を持つ
    body: { message: "hi" },
  });
  void client.POST("/api/v1/games/{gameId}/hints", {
    params: { path: { gameId: GAME_ID } },
    // @ts-expect-error ヒントの番号は数値
    body: { index: "1" },
  });

  void client.POST("/api/v1/games", { body: { language: "sv" } }).then(({ data }) => {
    // @ts-expect-error GameStart に単語はない
    return data?.word;
  });
}
