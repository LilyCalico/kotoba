# NestJS の設定手順

`apps/api` を組み立て、エンドポイントを 1 つ追加するまでの手順。モノレポ全体の構成は [monorepo-turborepo.md](monorepo-turborepo.md) を参照する。

## このリポジトリでの前提

| 項目 | 値 | 理由 |
| --- | --- | --- |
| モジュール形式 | ESM（`"type": "module"`） | NestJS 12 が ESM で配布されている |
| TypeScript | 6 系 | `@nestjs/schematics` が `>=6.0.0` を要求する |
| 公開接頭辞 | `/api/v1` | Vercel Services の公開ルーティングが `/api/v1/(.*)` を api に向ける |
| エラーの形 | RFC 9457 の Problem Details に `code` を足したもの | `docs/specifications/api.md`「エラー」。画面は `code` で分岐する |
| ポート | `process.env.PORT ?? 3001` | web の 3000 と衝突させない |

## 1. 依存を入れる

`nest new` は使わない。あれは新しいディレクトリに独自のリポジトリを作るコマンドであり、既存のワークスペースには噛み合わない。ワークスペースに直接必要なものだけを入れる。

```bash
pnpm --filter @kotoba/api add @nestjs/common @nestjs/core @nestjs/platform-express reflect-metadata rxjs zod
pnpm --filter @kotoba/api add -D @nestjs/cli @nestjs/schematics typescript@^6 @types/node @types/express@^5
```

| パッケージ | 役割 |
| --- | --- |
| `@nestjs/common` | デコレーター（`@Module` `@Controller` `@Injectable`）と例外クラス |
| `@nestjs/core` | アプリケーションの起動と DI コンテナ |
| `@nestjs/platform-express` | HTTP サーバーの実装。NestJS 自体は HTTP に依存しない設計のため、別パッケージになっている |
| `rxjs` | インターセプターとガードが Observable を扱う |
| `zod` | コントローラーが `packages/shared` にないスキーマ（`gameId` の `z.uuid()` など）を組み立てるときに import する |
| `@nestjs/cli` | `nest build` / `nest start --watch` |
| `@types/express` | ミドルウェアと例外フィルターで Express の `Request` / `Response` に型を付ける。`@nestjs/platform-express` が使う Express 5 に揃える |

## 2. 設定ファイルを置く

`apps/api/nest-cli.json` — CLI にソースの位置を教える。

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": { "deleteOutDir": true }
}
```

`apps/api/tsconfig.json` — 外せない設定は次の 4 つ。

```json
{
  "compilerOptions": {
    "module": "node16",
    "moduleResolution": "node16",
    "target": "ES2023",
    "lib": ["ES2023"],
    "types": ["node"],
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

| 設定 | 外すとどうなるか |
| --- | --- |
| `experimentalDecorators` | `@Module()` などの構文自体がエラーになる |
| `emitDecoratorMetadata` | 構文は通るが、DI が引数の型を判別できず注入に失敗する |
| `types: ["node"]` | `process` が解決できない |
| `rootDir` | TypeScript 6 が出力構造の明示を要求してエラーになる |

`package.json` の scripts。

```json
{
  "type": "module",
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main.js",
    "typecheck": "tsc --noEmit"
  }
}
```

## 3. 起動点を書く

アプリの設定は `configureApp` にまとめ、起動点とテストの両方から呼ぶ。テストが本番と同じ HTTP の振る舞い（接頭辞・ヘッダー・エラーの形）を通るようにするためである。

```typescript
// apps/api/src/configure-app.ts
import { type INestApplication, StandardSchemaValidationPipe } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "./common/api-error.js";
import { ProblemDetailsFilter } from "./common/problem-details.filter.js";

export const GLOBAL_PREFIX = "/api/v1";

export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix(GLOBAL_PREFIX);
  app.use((_request: Request, response: Response, next: NextFunction) => {
    response.setHeader("Cache-Control", "no-store");
    next();
  });
  app.useGlobalPipes(
    new StandardSchemaValidationPipe({
      exceptionFactory: (issues) =>
        new ApiError("validation_error", issues.map(({ path, message }) => `${formatPath(path)}: ${message}`).join("; ")),
    }),
  );
  app.useGlobalFilters(new ProblemDetailsFilter());
}
```

```typescript
// apps/api/src/main.ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { configureApp } from "./configure-app.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
```

| 設定 | 理由 |
| --- | --- |
| `setGlobalPrefix("/api/v1")` | Vercel Services がサービスに元のリクエストパスをそのまま渡す。`/api/v1/games` は `/games` に縮まらない。先頭の `/` は省かない（「つまずきポイント」参照） |
| `Cache-Control: no-store` | ゲームの応答は呼び出しごとに変わる。成功も失敗も、ブラウザや CDN に残さない |
| `StandardSchemaValidationPipe` | 引数に付けた zod スキーマで検証し、変換後の値を渡す。合わなければ `validation_error`。`formatPath` は issue の位置を `text` や `excludeWordIds.0` の形にする（「入力の検証」参照） |
| `ProblemDetailsFilter` | すべての失敗を Problem Details で返す（「エラーを Problem Details で返す」参照） |

```typescript
// apps/api/src/app.module.ts
import { Module } from "@nestjs/common";

@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

## NestJS の骨格

NestJS の構成要素は 3 つしかない。

| 要素 | デコレーター | 役割 |
| --- | --- | --- |
| **コントローラー** | `@Controller()` | HTTP のパスとメソッドを受け取り、結果を返す。ロジックは持たない |
| **プロバイダー** | `@Injectable()` | ロジックを持つ。コントローラーや他のプロバイダーに注入される |
| **モジュール** | `@Module()` | どのコントローラーとプロバイダーが存在するかを宣言する |

**依存は型で解決される。** コンストラクタの引数に型を書くだけで、対応するプロバイダーのインスタンスが渡される。

```typescript
constructor(private readonly games: GamesService) {}
```

`GamesService` を自分で `new` しない。NestJS が起動時にインスタンスを 1 つ作り、必要な場所に配る。この解決に使われるのが `emitDecoratorMetadata` で残した引数の型情報である。テスト時にはモックを差し替えられる。

**モジュールへの登録が必須。** クラスにデコレーターを付けただけでは認識されない。`@Module()` の `controllers` と `providers` に並べて初めて DI コンテナに入る。

## 4. エンドポイントを 1 つ足す

`games` という機能を足す場合、作るファイルは 4 つ。**サービス → コントローラー → モジュール → 親モジュールへの登録** の順に書く。

### 入力の検証

このリポジトリは検証に zod を使う。NestJS 12 は Standard Schema に対応しており、zod 4 のスキーマをそのまま引数に付けられる。

```typescript
@Body({ schema: playerInputSchema }) { text }: PlayerInput
@Param("gameId", { schema: z.uuid() }) gameId: string
```

付けたスキーマは、`configureApp` で全体に登録した `StandardSchemaValidationPipe` が検証に使う。検証を通った値はスキーマで変換したもの（`trim` や既定値を当てたもの）になる。同じスキーマを、OpenAPI 仕様の生成も本文とパスパラメーターの形に使う（[openapi.md](openapi.md)）。

### エラーを Problem Details で返す

失敗は `ApiError`（`apps/api/src/common/api-error.ts`）に `code` を持たせて投げる。HTTP ステータスは `code` から決まる。

```typescript
throw new ApiError("game_not_found", "The game does not exist or has expired.");
```

全体の例外フィルター `ProblemDetailsFilter`（`apps/api/src/common/problem-details.filter.ts`）が、すべての例外を `application/problem+json` の本文に変える。

| 例外 | 応答 |
| --- | --- |
| `ApiError` | `code` に対応するステータスと、その `code` |
| 存在しないルート・メソッド違い（Nest の `NotFoundException`） | 404 の `internal_error` |
| 壊れた JSON・大きすぎる本文（express の body-parser のエラー） | 400 / 413 の `validation_error` |
| それ以外 | 500 の `internal_error`。中身はサーバーのログにだけ出す |

body-parser のエラーは `HttpException` ではなく、`status` と `expose: true` を持つエラー（http-errors）として届く。フィルターはこれも HTTP の失敗として読む。

`detail` はそのまま応答に載るため、正解の単語や Q&A 履歴などの秘密を書かない。

### サービス

```typescript
// apps/api/src/games/games.service.ts
import { Injectable } from "@nestjs/common";
import type { InputResult } from "@kotoba/shared";

@Injectable()
export class GamesService {
  async input(gameId: string, text: string): Promise<InputResult> {
    return { kind: "question", verdict: "unclear" };
  }
}
```

### コントローラー

```typescript
// apps/api/src/games/games.controller.ts
import { Body, Controller, HttpCode, HttpStatus, Param, Post } from "@nestjs/common";
import { playerInputSchema, type InputResult, type PlayerInput } from "@kotoba/shared";
import { z } from "zod";
import { GamesService } from "./games.service.js";

@Controller("games")
export class GamesController {
  constructor(private readonly games: GamesService) {}

  @Post(":gameId/inputs")
  @HttpCode(HttpStatus.OK)
  input(
    @Param("gameId", { schema: z.uuid() }) gameId: string,
    @Body({ schema: playerInputSchema }) { text }: PlayerInput,
  ): Promise<InputResult> {
    return this.games.input(gameId, text);
  }
}
```

`@Controller("games")` と `@Post(":gameId/inputs")` と `setGlobalPrefix("/api/v1")` が連結して `POST /api/v1/games/{gameId}/inputs` になる。`@Post()` の既定のステータスは 201 のため、リソースを作らない操作には `@HttpCode(HttpStatus.OK)` を付ける。

### モジュール

```typescript
// apps/api/src/games/games.module.ts
import { Module } from "@nestjs/common";
import { GamesController } from "./games.controller.js";
import { GamesService } from "./games.service.js";

@Module({
  controllers: [GamesController],
  providers: [GamesService],
})
export class GamesModule {}
```

### 親モジュールに繋ぐ

```typescript
// apps/api/src/app.module.ts
import { Module } from "@nestjs/common";
import { GamesModule } from "./games/games.module.js";

@Module({
  imports: [GamesModule],
})
export class AppModule {}
```

## 5. 起動して確認する

```bash
pnpm --filter @kotoba/api dev
```

起動ログにマップされたルートが出る。ここに出ていなければ、モジュールへの登録が漏れている。

```
[RoutesResolver] GamesController {/api/v1/games}:
[RouterExplorer] Mapped {/api/v1/games/:gameId/inputs, POST} route
```

疎通を確認する。

```bash
curl -X POST http://localhost:3001/api/v1/games \
  -H "Content-Type: application/json" \
  -d '{"language":"sv","locale":"ja"}'
```

検証が効いていることは、スキーマに反する入力で確かめる。`gameId` を UUID でない値にすると、400 の Problem Details が返る。

```bash
curl -X POST http://localhost:3001/api/v1/games/not-a-uuid/inputs \
  -H "Content-Type: application/json" \
  -d '{"text":"金曜日に限った言葉ですか？"}'
```

```json
{ "type": "about:blank", "title": "Bad Request", "status": 400, "code": "validation_error", "detail": "(root): Invalid UUID" }
```

## つまずきポイント

### Nest can't resolve dependencies

**症状**: 起動時に `Nest can't resolve dependencies of the GamesController (?)` で落ちる。

**原因**: 注入しようとしているクラスが、そのモジュールの `providers` に登録されていない。`?` の位置が、解決できなかった引数を示す。

**対処**: `@Module()` の `providers` に加える。別モジュールのプロバイダーを使う場合は、提供側で `exports` に並べ、利用側で `imports` する。

### ルートが 404 になる

**症状**: コントローラーを書いたのに 404 が返る。

**原因**: 3 つのいずれか。モジュールが `AppModule` の `imports` にない / `setGlobalPrefix` の接頭辞を付け忘れている / `@Controller()` と `@Post()` のパスの組み立てを誤っている。

**対処**: 起動ログの `Mapped {...} route` を見る。ここに出ないならモジュール登録の問題、出ているのに 404 ならパスの問題。

### zod が解決できない

**症状**: `TS2307: Cannot find module 'zod'`。

**原因**: pnpm は依存を巻き上げないため、`packages/shared` が `zod` を持っていても `apps/api` からは見えない。

**対処**: 直接 import するワークスペースが自分で宣言する。`pnpm --filter @kotoba/api add zod`

### 引数が undefined で注入される

**症状**: DI は成功するのに、注入されたプロパティが `undefined`。

**原因**: `emitDecoratorMetadata` が無効。型情報がコンパイル後に残らず、NestJS が何を注入すべきか判別できない。

**対処**: `tsconfig.json` で `emitDecoratorMetadata` と `experimentalDecorators` を有効にする。

### ERR_MODULE_NOT_FOUND

**症状**: ビルドは通るのに `node dist/main.js` が相対 import を解決できない。

**原因**: ESM は相対 import の拡張子を省略できない。

**対処**: `from "./games.module.js"` のように付ける。ソースが `.ts` でも指定は `.js` にする。

### 存在しないルートの 404 が HTML で返る

**症状**: `/api/v1` の下の存在しないパスに、Problem Details ではなく Express の `Cannot GET ...` という HTML が返る。例外フィルターを通らない。

**原因**: Nest の Express アダプターは、存在しないルートの 404 を受けるハンドラーを接頭辞の下にマウントする。接頭辞をそのままマウント先に使うため、`setGlobalPrefix("api/v1")` のように先頭の `/` がないと、どのパスにも当たらない。

**対処**: `setGlobalPrefix("/api/v1")` と先頭の `/` を付ける。ルートの登録は `/` の有無によらず同じになる。

### 依存の循環

**症状**: 起動時に `A circular dependency has been detected` と出る。

**原因**: 2 つのプロバイダーが互いを注入し合っている。

**対処**: 共通部分を第 3 のプロバイダーに切り出す。切り出せない場合のみ、双方で `forwardRef(() => OtherService)` を使う。
