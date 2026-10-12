# OpenAPI 仕様を @nestjs/swagger と zod の Standard Schema から生成する

## ステータス

採用

## コンテキスト

`apps/web` は `apps/api` のゲームセッション API だけを通してゲームを進める。API の型が変わったとき、web の型がコマンド 1 つで追従し、手書きの型と実装が食い違わない状態にしたい。

リクエストとレスポンスの形は、すでに `packages/shared` の zod スキーマが持っている。api はこのスキーマで入力を検証し、web はこのスキーマの型を使う。形の定義を OpenAPI のために二重に書くことは避けたい。

前提となるバージョンは次のとおり。

| 項目 | バージョン |
| --- | --- |
| NestJS | 12 |
| zod | 4（Standard Schema と、その JSON Schema 変換の口を持つ） |
| `apps/web` の TypeScript | 5 |

満たすべき要件は 3 つある。

1. 形の定義は zod スキーマだけが持つ
2. パスとメソッドの一覧は、実際にリクエストを受けるコントローラーと食い違わない
3. web から、パス・メソッド・本文・応答に型が付いた呼び出しができる

## 決定

仕様は `@nestjs/swagger` でコントローラーから組み立て、形は zod の Standard Schema から取る。web の型は `openapi-typescript` で生成し、`openapi-fetch` で呼ぶ。

| 段 | 使うもの | 中身 |
| --- | --- | --- |
| 検証 | NestJS 12 の `StandardSchemaValidationPipe` | コントローラーの引数に `@Body({ schema })` / `@Param("gameId", { schema })` で zod スキーマを付け、全体のパイプがそれで検証する |
| 仕様 | `@nestjs/swagger` 12 | 引数に付けたスキーマから本文とパスパラメーターを、`@ApiOkResponse({ standardSchema })` から応答を、zod の JSON Schema 変換（`target: "openapi-3.0"`）で書き出す。zod スキーマに `meta({ id })` で付けた名前が `components.schemas` の名前になる |
| 型 | `openapi-typescript` | `apps/api/openapi.json` から `apps/web/lib/api/schema.d.ts` を生成する |
| 呼び出し | `openapi-fetch` | 生成した型を渡して、相対パス `/api/v1/...` を叩く |

`openapi.json` と `schema.d.ts` はコミットし、CI で生成し直して差分がないことを確かめる。

## 検討した選択肢

### nestjs-zod

zod スキーマから DTO クラスを作り、`@nestjs/swagger` に読ませるライブラリ。NestJS で zod を使うときの定番である。

対応は NestJS 11 と `@nestjs/swagger` 11 までで、NestJS 12 で動く保証がない。NestJS 12 と `@nestjs/swagger` 12 が Standard Schema を直接扱えるようになったため、DTO クラスを挟む必要もなくなった。

### @asteasolutions/zod-to-openapi

zod スキーマのレジストリから OpenAPI 仕様を組み立てるライブラリ。`@nestjs/swagger` を使わない。

形は zod スキーマから取れるが、パスとメソッドの一覧をコントローラーとは別にレジストリへ書くことになる。要件 2 を満たすには、両者の一致をテストで見張る必要がある。

### @nestjs/swagger と Standard Schema（採用）

パスはコントローラーのデコレーター、形は引数と応答に付けた zod スキーマから取る。検証に使うスキーマと仕様に載るスキーマが同じ値になり、要件 1 と 2 を構造で満たす。

### クライアントの生成

| 候補 | 評価 |
| --- | --- |
| `openapi-typescript` + `openapi-fetch`（採用） | 生成物は型だけで、実行時のコードは数 KB の `openapi-fetch` だけ。パス・メソッド・本文・応答の型が付く |
| `openapi-typescript` の型だけ | 素の fetch に型を手で当てることになり、パスと本文の対応を人が保つ |
| `@hey-api/openapi-ts` / `orval` | 関数付きの SDK を丸ごと生成する。4 つのエンドポイントに対して生成物が大きい |

## 影響

### 得たもの

- `packages/shared` のスキーマを変えると、`pnpm generate:api` 1 つで web の型が変わる
- 入力の検証に NestJS の組み込みのパイプを使い、自前の検証パイプを持たない
- 失敗の応答（Problem Details）も仕様に載り、web の型が失敗の形を知る

### 引き受けたコスト

- 仕様の名前（`meta({ id })`）を `packages/shared` のスキーマに書く。共有スキーマが OpenAPI の都合を少しだけ知る
- 仕様の出力はビルドした `dist` で動かす。tsx などの esbuild 系の実行は `emitDecoratorMetadata` を出さず、NestJS がアプリを組み立てられない。web の型検査の前に api のビルドが走る
- 失敗の応答は `application/problem+json` で返すため、`@nestjs/swagger` の既定の `application/json` とは別に、`Problem` への参照を自前のデコレーター（`ApiProblemResponses`）で載せる
- openapi-typescript 7 は既定で `default` を持つ項目を必須として扱う。リクエストで省略できる項目が必須にならないよう、`--default-non-nullable false` を付ける

## 見直しの条件

- `@nestjs/swagger` の Standard Schema 対応が、使っている zod の機能（判別共用体・`lazy` など）を表せなくなったとき
- エンドポイントが増え、生成した SDK の関数のほうが `openapi-fetch` のパス指定より扱いやすくなったとき
