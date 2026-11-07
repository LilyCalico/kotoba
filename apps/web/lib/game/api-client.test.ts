import { describe, expect, it } from "vitest";

import { createApiGameClient } from "./api-client";
import { GameClientError } from "./client";

const GAME_ID = "4f0e8c4e-6a43-4c5e-9d6a-2b9c7a3e1f00";

/** 受け取ったリクエストを記録し、決まった応答を返す fetch。 */
function fakeFetch(respond: () => Response | Promise<Response>) {
  const requests: Request[] = [];
  const fetch = async (request: Request) => {
    requests.push(request);
    return respond();
  };
  return { fetch, requests };
}

function json(status: number, body: unknown, contentType = "application/json") {
  return () => new Response(JSON.stringify(body), { status, headers: { "Content-Type": contentType } });
}

function problem(status: number, code: string) {
  return json(
    status,
    { type: "about:blank", title: "Error", status, code, detail: "detail" },
    "application/problem+json",
  );
}

function clientWith(respond: () => Response | Promise<Response>) {
  const { fetch, requests } = fakeFetch(respond);
  return { client: createApiGameClient({ baseUrl: "http://localhost", fetch }), requests };
}

/** 失敗の `code` を取り出す。失敗しなければテストを落とす。 */
async function codeOf(promise: Promise<unknown>): Promise<string> {
  const error = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(GameClientError);
  return (error as GameClientError).code;
}

describe("createApiGameClient", () => {
  it("startGame は language・locale・excludeWordIds を送る", async () => {
    const start = { gameId: GAME_ID, language: "sv", mode: "guess_word", teaser: "teaser" };
    const { client, requests } = clientWith(json(201, start));

    await expect(
      client.startGame({ language: "sv", locale: "en", excludeWordIds: ["fika"] }),
    ).resolves.toEqual(start);

    const [request] = requests;
    expect(request?.method).toBe("POST");
    expect(request?.url).toBe("http://localhost/api/v1/games");
    expect(await request?.json()).toEqual({
      language: "sv",
      locale: "en",
      excludeWordIds: ["fika"],
    });
  });

  it("sendInput・revealHint・giveUp は gameId のパスを叩く", async () => {
    const { client, requests } = clientWith(json(200, { kind: "question", verdict: "unclear" }));

    await client.sendInput(GAME_ID, { text: "Is it a feeling?" });
    await client.revealHint(GAME_ID, 2);
    await client.giveUp(GAME_ID);

    expect(requests.map((request) => request.url)).toEqual([
      `http://localhost/api/v1/games/${GAME_ID}/inputs`,
      `http://localhost/api/v1/games/${GAME_ID}/hints`,
      `http://localhost/api/v1/games/${GAME_ID}/give-up`,
    ]);
    expect(await requests[0]?.json()).toEqual({ text: "Is it a feeling?" });
    expect(await requests[1]?.json()).toEqual({ index: 2 });
  });

  it("Problem Details の失敗は、その code を持たせる", async () => {
    const { client } = clientWith(problem(404, "game_not_found"));

    expect(await codeOf(client.giveUp(GAME_ID))).toBe("game_not_found");
  });

  it("Retry-After があれば、その秒数を持たせる", async () => {
    const limited = () =>
      new Response(
        JSON.stringify({ type: "about:blank", title: "Service Unavailable", status: 503, code: "ai_rate_limited" }),
        { status: 503, headers: { "Content-Type": "application/problem+json", "Retry-After": "37" } },
      );
    const { client } = clientWith(limited);

    const error = await client.sendInput(GAME_ID, { text: "fika" }).catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(GameClientError);
    expect(error).toMatchObject({ code: "ai_rate_limited", retryAfterSeconds: 37 });
  });

  it("Retry-After がない・秒数でないときは、秒数を持たせない", async () => {
    const cases: Record<string, string>[] = [{}, { "Retry-After": "Wed, 21 Oct 2026 07:28:00 GMT" }];
    for (const headers of cases) {
      const { client } = clientWith(() =>
        new Response(
          JSON.stringify({ type: "about:blank", title: "Service Unavailable", status: 503, code: "ai_rate_limited" }),
          { status: 503, headers: { "Content-Type": "application/problem+json", ...headers } },
        ),
      );

      const error = await client.sendInput(GAME_ID, { text: "fika" }).catch((reason: unknown) => reason);
      expect((error as GameClientError).retryAfterSeconds).toBeUndefined();
    }
  });

  it("Problem Details として読めない失敗は network_error にする", async () => {
    const html = () =>
      new Response("<html>Bad Gateway</html>", {
        status: 502,
        headers: { "Content-Type": "text/html" },
      });
    const { client } = clientWith(html);

    expect(await codeOf(client.sendInput(GAME_ID, { text: "fika" }))).toBe("network_error");
  });

  it("知らない code の失敗は network_error にする", async () => {
    const { client } = clientWith(problem(500, "something_new"));

    expect(await codeOf(client.revealHint(GAME_ID, 1))).toBe("network_error");
  });

  it("本文が JSON でない成功は network_error にする", async () => {
    const html = () => new Response("<html></html>", { status: 200 });
    const { client } = clientWith(html);

    expect(await codeOf(client.startGame({ language: "sv" }))).toBe("network_error");
  });

  it("通信の失敗は network_error にする", async () => {
    const { client } = clientWith(() => Promise.reject(new TypeError("Failed to fetch")));

    expect(await codeOf(client.startGame({ language: "sv" }))).toBe("network_error");
  });
});
