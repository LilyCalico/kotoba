import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { AppModule } from "../app.module.js";
import { configureApp } from "../configure-app.js";
import { words } from "../prisma/seed/words.js";
import { WordsService } from "../words/words.service.js";
import { GAME_STORE } from "./game-store.js";
import { MemoryGameStore } from "./memory-game-store.js";

const lagom = words.find((word) => word.id === "lagom");
if (!lagom) throw new Error("lagom が見つからない");

/** 出題を lagom に固定した `WordsService` の代役。DB を使わずに HTTP の振る舞いだけを見る。 */
const fakeWords = {
  pick: vi.fn(async ({ language }: { language: string }) =>
    language === lagom.language ? lagom : undefined,
  ),
  findById: vi.fn(async (id: string) => (id === lagom.id ? lagom : undefined)),
};

/** ゲームが終わるまで、どの応答にも現れてはならない文字列。 */
const SECRETS = [
  lagom.id,
  lagom.word,
  lagom.reading,
  lagom.definition.en,
  lagom.definition.ja,
  ...lagom.acceptedAnswers,
];

let app: INestApplication;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(WordsService)
    .useValue(fakeWords)
    // 保存先もメモリ内の実装に差し替え、DB なしで流せるようにする。
    .overrideProvider(GAME_STORE)
    .useValue(new MemoryGameStore())
    .compile();

  app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
});

afterAll(async () => {
  await app.close();
});

function post(path: string, body?: object) {
  const req = request(app.getHttpServer()).post(`/api/v1${path}`);
  return body === undefined ? req : req.send(body);
}

async function startGame(locale: "ja" | "en" = "en"): Promise<string> {
  const response = await post("/games", { language: "sv", locale }).expect(201);
  return response.body.gameId as string;
}

describe("ゲーム開始", () => {
  it("locale の言語で teaser を返し、単語は返さない", async () => {
    const response = await post("/games", { language: "sv", locale: "ja" }).expect(201);

    expect(response.body).toEqual({
      gameId: expect.stringMatching(/^[0-9a-f-]{36}$/),
      language: "sv",
      teaser: lagom.teaser.ja,
    });
  });

  it("excludeWordIds を単語の選出に渡す", async () => {
    await post("/games", { language: "sv", excludeWordIds: ["fika"] }).expect(201);

    expect(fakeWords.pick).toHaveBeenLastCalledWith({ language: "sv", excludeWordIds: ["fika"] });
  });

  it("単語のない言語と、上限を超える excludeWordIds は validation_error", async () => {
    await post("/games", { language: "ja" }).expect(400);
    const tooMany = Array.from({ length: 101 }, (_, i) => `w${i}`);
    const response = await post("/games", { language: "sv", excludeWordIds: tooMany }).expect(400);

    expect(response.body.code).toBe("validation_error");
  });
});

describe("ゲーム 1 周", () => {
  it("質問 → ヒント 3 回 → 誤答 → 正解 の順に進み、終わるまで秘密を返さない", async () => {
    const gameId = await startGame();
    const beforeEnd = [
      await post(`/games/${gameId}/inputs`, { text: "Is it a feeling?" }).expect(200),
      await post(`/games/${gameId}/hints`, { index: 1 }).expect(200),
      await post(`/games/${gameId}/hints`, { index: 2 }).expect(200),
      await post(`/games/${gameId}/hints`, { index: 3 }).expect(200),
      await post(`/games/${gameId}/inputs`, { text: "fika" }).expect(200),
    ];

    expect(beforeEnd.map(({ body }) => body)).toEqual([
      { kind: "question", verdict: "unclear" },
      { index: 1, text: lagom.hints.en[0] },
      { index: 2, text: lagom.hints.en[1] },
      { index: 3, text: lagom.hints.en[2] },
      { kind: "answer", correct: false },
    ]);
    for (const { text } of beforeEnd) {
      for (const secret of SECRETS) expect(text).not.toContain(secret);
    }

    // スペルミスの救済判定（#29）までは、正規化マッチを外れた綴りは誤答になる。
    const misspelled = await post(`/games/${gameId}/inputs`, { text: "laagom" }).expect(200);
    expect(misspelled.body).toEqual({ kind: "answer", correct: false });

    const correct = await post(`/games/${gameId}/inputs`, { text: "Lagom" }).expect(200);
    expect(correct.body).toEqual({
      kind: "answer",
      correct: true,
      result: {
        outcome: "cleared",
        wordId: "lagom",
        word: "Lagom",
        partOfSpeech: "adjective",
        definition: lagom.definition.en,
        note: lagom.note?.en,
        example: { sv: lagom.example?.sv, translation: lagom.example?.translations.en },
      },
    });
  });

  it("ギブアップで正解を返す", async () => {
    const gameId = await startGame("ja");

    const response = await post(`/games/${gameId}/give-up`).expect(200);

    expect(response.body).toEqual({
      outcome: "gave_up",
      wordId: "lagom",
      word: "Lagom",
      partOfSpeech: "adjective",
      definition: lagom.definition.ja,
      note: lagom.note?.ja,
      example: { sv: lagom.example?.sv, translation: lagom.example?.translations.ja },
    });
  });
});

describe("ヒント開示", () => {
  it("開示済みの番号には同じヒントを返す", async () => {
    const gameId = await startGame();
    await post(`/games/${gameId}/hints`, { index: 1 }).expect(200);
    await post(`/games/${gameId}/hints`, { index: 2 }).expect(200);

    const again = await post(`/games/${gameId}/hints`, { index: 1 }).expect(200);
    expect(again.body).toEqual({ index: 1, text: lagom.hints.en[0] });

    // 再送で数は進まない。次に開示できるのは 3 番。
    await post(`/games/${gameId}/hints`, { index: 3 }).expect(200);
  });

  it("飛び番は hint_out_of_order、4 以上は hint_limit_reached", async () => {
    const gameId = await startGame();

    const skipped = await post(`/games/${gameId}/hints`, { index: 2 }).expect(409);
    const overLimit = await post(`/games/${gameId}/hints`, { index: 4 }).expect(409);

    expect(skipped.body.code).toBe("hint_out_of_order");
    expect(overLimit.body.code).toBe("hint_limit_reached");
  });
});

describe("終了したゲームへの操作", () => {
  it("クリア後: 入力とギブアップはクリアの結果を返し直し、ヒントは game_finished", async () => {
    const gameId = await startGame();
    const cleared = await post(`/games/${gameId}/inputs`, { text: "lagom" }).expect(200);

    const input = await post(`/games/${gameId}/inputs`, { text: "anything" }).expect(200);
    const giveUp = await post(`/games/${gameId}/give-up`).expect(200);
    const hint = await post(`/games/${gameId}/hints`, { index: 1 }).expect(409);

    expect(input.body).toEqual(cleared.body);
    expect(giveUp.body).toEqual(cleared.body.result);
    expect(hint.body.code).toBe("game_finished");
  });

  it("ギブアップ後: ギブアップは同じ結果を返し、入力とヒントは game_finished", async () => {
    const gameId = await startGame();
    const gaveUp = await post(`/games/${gameId}/give-up`).expect(200);

    const again = await post(`/games/${gameId}/give-up`).expect(200);
    const input = await post(`/games/${gameId}/inputs`, { text: "lagom" }).expect(409);
    const hint = await post(`/games/${gameId}/hints`, { index: 1 }).expect(409);

    expect(again.body).toEqual(gaveUp.body);
    expect(input.body.code).toBe("game_finished");
    expect(hint.body.code).toBe("game_finished");
  });
});

describe("エラー", () => {
  it("Problem Details の形で、code 付きで返す", async () => {
    const response = await post("/games/00000000-0000-4000-8000-000000000000/give-up").expect(404);

    expect(response.headers["content-type"]).toMatch(/^application\/problem\+json/);
    expect(response.body).toEqual({
      type: "about:blank",
      title: "Not Found",
      status: 404,
      code: "game_not_found",
      detail: "The game does not exist or has expired.",
    });
  });

  it("UUID でない gameId と、スキーマに合わない本文は validation_error", async () => {
    const gameId = await startGame();

    const badId = await post("/games/not-a-uuid/hints", { index: 1 }).expect(400);
    const empty = await post(`/games/${gameId}/inputs`, { text: "   " }).expect(400);
    const tooLong = await post(`/games/${gameId}/inputs`, { text: "a".repeat(201) }).expect(400);

    for (const { body } of [badId, empty, tooLong]) expect(body.code).toBe("validation_error");
  });

  it("壊れた JSON は 400、大きすぎる本文は 413 の validation_error", async () => {
    const broken = await request(app.getHttpServer())
      .post("/api/v1/games")
      .set("Content-Type", "application/json")
      .send("{broken")
      .expect(400);
    const huge = await post("/games", { language: "sv", padding: "x".repeat(200_000) }).expect(413);

    expect(broken.body.code).toBe("validation_error");
    expect(huge.body.code).toBe("validation_error");
  });

  it("存在しないルートとメソッド違いは 404 の internal_error", async () => {
    const missing = await request(app.getHttpServer()).get("/api/v1/nope").expect(404);
    const wrongMethod = await request(app.getHttpServer()).get("/api/v1/games").expect(404);

    for (const { body } of [missing, wrongMethod]) expect(body.code).toBe("internal_error");
  });

  it("成功にも失敗にも Cache-Control: no-store を付ける", async () => {
    const success = await post("/games", { language: "sv" }).expect(201);
    const failure = await post("/games", { language: "ja" }).expect(400);

    expect(success.headers["cache-control"]).toBe("no-store");
    expect(failure.headers["cache-control"]).toBe("no-store");
  });
});
