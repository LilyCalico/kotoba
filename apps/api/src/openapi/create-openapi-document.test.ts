import type { INestApplication } from "@nestjs/common";
import type { OpenAPIObject } from "@nestjs/swagger";
import { Test } from "@nestjs/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "../app.module.js";
import { configureApp } from "../configure-app.js";
import { createOpenApiDocument } from "./create-openapi-document.js";

let app: INestApplication;
let document: OpenAPIObject;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  configureApp(app);
  document = createOpenApiDocument(app);
});

afterAll(async () => {
  await app.close();
});

/** 値の中のすべての `$ref` を集める。 */
function collectRefs(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(collectRefs);
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) =>
    key === "$ref" && typeof child === "string" ? [child] : collectRefs(child),
  );
}

describe("createOpenApiDocument", () => {
  it("ゲームセッション API の 4 つのエンドポイントを載せる", () => {
    expect(
      Object.entries(document.paths).flatMap(([path, item]) =>
        Object.entries(item).map(([method, operation]) => `${method} ${path} ${operation.operationId}`),
      ),
    ).toEqual([
      "post /api/v1/games start",
      "post /api/v1/games/{gameId}/inputs input",
      "post /api/v1/games/{gameId}/hints revealHint",
      "post /api/v1/games/{gameId}/give-up giveUp",
    ]);
  });

  it("すべての $ref が components.schemas の名前付きスキーマを指す", () => {
    const names = Object.keys(document.components?.schemas ?? {});
    const refs = new Set(collectRefs(document));

    expect(names).toEqual(
      expect.arrayContaining([
        "StartGameRequest",
        "PlayerInput",
        "HintRequest",
        "GameStart",
        "InputResult",
        "Hint",
        "GameResult",
        "Problem",
      ]),
    );
    for (const ref of refs) {
      expect(names.map((name) => `#/components/schemas/${name}`)).toContain(ref);
    }
  });

  it("どの操作も、失敗を application/problem+json の Problem で返すと載せる", () => {
    for (const item of Object.values(document.paths)) {
      for (const operation of Object.values(item)) {
        const failures = Object.entries(operation.responses).filter(([status]) => Number(status) >= 400);

        expect(failures.map(([status]) => status)).toContain("500");
        for (const [, response] of failures) {
          expect(response).toMatchObject({
            content: { "application/problem+json": { schema: { $ref: "#/components/schemas/Problem" } } },
          });
        }
      }
    }
  });

  it("gameId を UUID のパスパラメーターとして載せる", () => {
    const operation = document.paths["/api/v1/games/{gameId}/inputs"]?.post;

    expect(operation?.parameters).toEqual([
      expect.objectContaining({ name: "gameId", in: "path", required: true, schema: expect.objectContaining({ format: "uuid" }) }),
    ]);
  });

  it("同じコードからは同じ仕様を作る", () => {
    expect(JSON.stringify(createOpenApiDocument(app))).toBe(JSON.stringify(document));
  });
});
