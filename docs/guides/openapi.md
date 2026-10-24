# OpenAPI 仕様と型付きクライアントの生成手順

`apps/api` のコントローラーから OpenAPI 仕様を書き出し、`apps/web` の型付きクライアントを生成するまでの手順。API の型を変えたら、コマンド 1 つで web の型に反映される。生成方法を選んだ理由は [ADR 0006](../adr/0006-openapi-from-zod-via-nestjs-swagger.md) を参照する。

## このリポジトリでの前提

| 項目 | 値 | 理由 |
| --- | --- | --- |
| 形の定義 | `packages/shared` の zod スキーマだけが持つ | api の検証、OpenAPI 仕様、web の型が同じスキーマから来る |
| 仕様の生成 | `@nestjs/swagger` 12 | NestJS 12 の Standard Schema 対応で、zod スキーマを直接読める |
| 型の生成 | `openapi-typescript` 7 | 生成物は型だけ |
| 呼び出し | `openapi-fetch` | 生成した型を渡すと、パス・メソッド・本文・応答に型が付く |
| 生成物 | `apps/api/openapi.json` と `apps/web/lib/api/schema.d.ts` をコミットする | 差分をレビューで見られる。鮮度は CI で守る |

## 1. 依存を入れる

```bash
pnpm --filter @kotoba/api add @nestjs/swagger@^12
pnpm --filter @kotoba/web add openapi-fetch
pnpm --filter @kotoba/web add -D openapi-typescript
```

## 2. zod スキーマに名前を付ける

リクエストとレスポンスのスキーマに `meta({ id })` で名前を付ける。この名前が仕様の `components.schemas` の名前になり、ほかの場所からは `$ref` で参照される。

```typescript
// packages/shared/src/game.ts
export const gameResultSchema = z.object({
  outcome: outcomeSchema,
  wordId: z.string(),
  word: z.string(),
  definition: z.string(),
}).meta({ id: "GameResult" });
```

名前を付けないスキーマは、使う場所に展開される。

## 3. コントローラーにスキーマを付ける

引数には `@Body({ schema })` / `@Param("gameId", { schema })` で zod スキーマを付ける。全体の `StandardSchemaValidationPipe`（`configureApp` で登録）がこれで検証し、`@nestjs/swagger` が本文とパスパラメーターの形に使う。

応答は `@ApiOkResponse` / `@ApiCreatedResponse` の `standardSchema` に、失敗は `ApiProblemResponses` に返し得るステータスを並べる。

```typescript
// apps/api/src/games/games.controller.ts
@Post(":gameId/inputs")
@HttpCode(HttpStatus.OK)
@ApiOkResponse({ description: "入力を判定した", standardSchema: inputResultSchema })
@ApiProblemResponses(HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND, HttpStatus.CONFLICT, HttpStatus.PAYLOAD_TOO_LARGE)
input(
  @Param("gameId", { schema: gameIdSchema }) gameId: string,
  @Body({ schema: playerInputSchema }) { text }: PlayerInput,
): Promise<InputResult> {
  return this.games.input(gameId, text);
}
```

| 部品 | 置き場所 | 役割 |
| --- | --- | --- |
| `ApiProblemResponses` | `apps/api/src/openapi/api-problem-responses.decorator.ts` | 失敗を `application/problem+json` の `Problem` として載せる。500 は常に足す |
| `createOpenApiDocument` | `apps/api/src/openapi/create-openapi-document.ts` | `SwaggerModule.createDocument` で仕様を組み立て、`Problem` を `components.schemas` に足す。`operationId` はメソッド名にする |
| `write-openapi` | `apps/api/src/openapi/write-openapi.ts` | アプリを組み立てて（起動はしない）仕様を JSON に書き出す |

`Problem` を自前で足すのは、失敗の応答だけ `application/problem+json` で `$ref` するためである。`standardSchema` で渡すと `@nestjs/swagger` は `application/json` に載せる。

## 4. 生成のスクリプトを置く

```json
// apps/api/package.json
"openapi": "node dist/openapi/write-openapi.js openapi.json"
```

```json
// apps/web/package.json
"generate:api": "openapi-typescript ../api/openapi.json --output lib/api/schema.d.ts --default-non-nullable false"
```

| 設定 | 理由 |
| --- | --- |
| `node dist/...` | ビルドした JavaScript で動かす。tsx などの esbuild 系の実行は `emitDecoratorMetadata` を出さず、NestJS がアプリを組み立てられない |
| `--default-non-nullable false` | 既定では `default` を持つ項目が必須の型になる。リクエストで省略できる `locale` や `excludeWordIds` を省略できるままにする |

生成した `schema.d.ts` は `apps/web/eslint.config.mjs` の `globalIgnores` に入れ、lint の対象から外す。

## 5. Turborepo に繋ぐ

```jsonc
// turbo.json
"@kotoba/web#typecheck": {
  "dependsOn": ["^build", "generate:api"]
},
"openapi": {
  "dependsOn": ["build"],
  "outputs": ["openapi.json"]
},
"generate:api": {
  "dependsOn": ["@kotoba/api#openapi"],
  "outputs": ["lib/api/schema.d.ts"]
}
```

api のビルド → 仕様の出力 → web の型の生成 → web の型検査、の順に流れる。ルートの `pnpm generate:api`（`turbo run generate:api`）で生成だけを流せる。

## 6. web から呼ぶ

```typescript
import { createApiClient } from "@/lib/api/client";

const client = createApiClient();
const { data, error } = await client.POST("/api/v1/games/{gameId}/inputs", {
  params: { path: { gameId } },
  body: { text },
});
```

`data` は成功の応答の型、`error` は Problem Details の型を持つ。仕様にないパスや、形の合わない本文は型エラーになる。web と api は同一ホストに載るため、`baseUrl` は付けず相対パスで呼ぶ。

## 7. CI で鮮度を確かめる

`.github/workflows/ci.yml` の `ci` ジョブの最後で、生成をやり直して差分を見る。

```yaml
- name: Check generated API types are up to date
  run: |
    pnpm generate:api
    git diff --exit-code -- apps/api/openapi.json apps/web/lib/api/schema.d.ts
```

API の型を変えて生成をし忘れると、ここで失敗する。

## 日々の操作

| やりたいこと | コマンド |
| --- | --- |
| API の型を変えたあと、仕様と web の型を作り直す | `pnpm generate:api` |
| 仕様の中身を見る | `apps/api/openapi.json` を開く |

## つまずきポイント

### 仕様の出力で依存が注入されない

**症状**: `tsx src/openapi/write-openapi.ts` で実行すると、`Nest can't resolve dependencies` で落ちる。

**原因**: tsx が使う esbuild は `emitDecoratorMetadata` を実装していない。コンストラクタの引数の型が残らず、NestJS が何を注入すべきか判別できない。

**対処**: `pnpm --filter @kotoba/api build` のあとに `node dist/openapi/write-openapi.js` で動かす。ルートの `pnpm generate:api` は Turborepo がビルドを先に流す。

### 既定値を持つ項目が必須の型になる

**症状**: `client.POST("/api/v1/games", { body: { language: "sv" } })` が、`locale` と `excludeWordIds` がないという型エラーになる。

**原因**: openapi-typescript 7 は既定で、`default` を持つ項目を必須として型にする（`--default-non-nullable` が既定で有効）。応答の型には合うが、リクエストでは省略できなくなる。

**対処**: `--default-non-nullable false` を付けて生成する。

### 必須の項目を足すと仕様の生成より先に api のビルドが落ちる

**症状**: `packages/shared` の応答のスキーマに必須の項目を足して `pnpm generate:api` を流すと、`@kotoba/api:build` が型エラーで止まる。

**原因**: api の実装がまだその項目を返していない。仕様はビルドした api から作るため、実装が追いつくまで生成できない。

**対処**: 先に api の実装を新しいスキーマに合わせてから生成する。
