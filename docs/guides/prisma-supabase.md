# Prisma と Supabase の設定手順

`apps/api` から Prisma で PostgreSQL（Supabase）を使うための手順。ローカルの Supabase を立て、migration と seed を流し、NestJS から `PrismaService` で DB に触れ、DB を使うテストを流すところまでを扱う。NestJS 自体の組み立ては [nestjs.md](nestjs.md) を参照する。

構成の判断は ADR に置いている。ローカルと CI の DB は [0005](../adr/0005-supabase-cli-for-local-and-ci-db.md)、単語の多言語テキストの持ち方は [0004](../adr/0004-localized-word-text-as-jsonb.md)、進行中ゲームの保存先は [0007](../adr/0007-game-store-on-postgresql.md)。

## このリポジトリでの前提

| 項目 | 値 | 理由 |
| --- | --- | --- |
| Prisma | 7 系（`prisma` / `@prisma/client` / `@prisma/adapter-pg`） | 3 つは同じバージョンで揃える。Renovate も 1 つの PR にまとめる |
| DB | PostgreSQL 17 | Supabase の既定。`supabase/config.toml` の `major_version` を本番と合わせる |
| ローカルの DB | Supabase CLI の `supabase start`（Docker） | 手元・CI・本番を同じ Supabase の構成に揃える |
| Supabase CLI | `apps/api` の devDependency | `pnpm install` だけで全員が同じバージョンになる |
| 生成した Prisma Client の置き場所 | `apps/api/src/generated/prisma`（Git には載せない） | `tsconfig.json` の `rootDir` が `src` のため |
| Node.js | 22.9 以上 | `dev` スクリプトが `--env-file-if-exists` を使う。CI は 24 |
| Docker | Docker Desktop など、Docker のデーモンが動くもの | `supabase start` がコンテナを立てる |

接続先は 2 つの環境変数で渡す。

| 変数 | 使う側 | ローカル | 本番（Supabase） |
| --- | --- | --- | --- |
| `DATABASE_URL` | アプリ（`PrismaService`） | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` | トランザクションプーラー（ポート 6543） |
| `DIRECT_URL` | Prisma CLI（migrate・db seed） | `DATABASE_URL` と同じ | 直接接続かセッションプーラー（ポート 5432） |

2 つに分けるのは、本番の Vercel ではインスタンスが多数立ち、アプリの接続をトランザクションプーラーで束ねる必要がある一方で、migration はトランザクションプーラーを通せないためである。

## 1. 依存を入れる

```bash
pnpm --filter @kotoba/api add @prisma/client@^7.10.0 @prisma/adapter-pg@^7.10.0
pnpm --filter @kotoba/api add -D prisma@^7.10.0 supabase tsx dotenv
```

`prisma` はバージョンを必ず指定する（「つまずきポイント」参照）。

| パッケージ | 役割 |
| --- | --- |
| `@prisma/client` | 生成した Prisma Client が実行時に使うランタイム |
| `@prisma/adapter-pg` | Prisma Client が `pg`（node-postgres）で DB につなぐためのドライバーアダプター。Prisma 7 では Client の生成時にアダプターを渡す |
| `prisma` | CLI（`generate` / `migrate` / `db seed`） |
| `supabase` | Supabase CLI。ローカルの Supabase を立てる |
| `tsx` | seed スクリプト（TypeScript）を `prisma db seed` から直接実行する |
| `dotenv` | `prisma.config.ts` で `.env` を読む。Prisma 7 の CLI は `.env` を自動では読まない |

`pnpm install` の最後に `Ignored build scripts: @prisma/engines, prisma` と出るが、そのままでよい。Prisma 7 の CLI は、必要なエンジンを最初に使うときに取得する。

## 2. ローカルの Supabase を用意する

`apps/api` で初期化する。

```bash
cd apps/api
pnpm exec supabase init --with-vscode-settings=false --with-intellij-settings=false
```

`apps/api/supabase/config.toml` が作られる。次の 3 か所を書き換える。

```toml
project_id = "kotoba"

[db.migrations]
# テーブルの定義は Prisma の migration（prisma/migrations）が持つ。Supabase の migration は使わない。
enabled = false

[db.seed]
# 初期データは `prisma db seed` が入れる。
enabled = false
```

| 設定 | 理由 |
| --- | --- |
| `project_id` | コンテナ名の接頭辞になる。既定ではディレクトリ名の `api` になり、何のプロジェクトか分からない |
| `db.migrations.enabled` | テーブルの定義を Prisma と Supabase の 2 か所で持たない |
| `db.seed.enabled` | 初期データの投入を `prisma db seed` に一本化する |

起動と停止はルートのスクリプトで行う。

```bash
pnpm db:start   # supabase start
pnpm db:stop    # supabase stop
```

初回はイメージの取得に時間がかかる。起動すると次のポートで待ち受ける。

| ポート | 中身 |
| --- | --- |
| 54322 | PostgreSQL |
| 54323 | Supabase Studio（ブラウザで DB の中身を見られる管理画面） |
| 54321 | Supabase の API（Auth・Storage など） |

## 3. 環境変数を置く

`apps/api/.env.example` をコピーする。ローカルの Supabase の既定値が入っている。

```bash
cp apps/api/.env.example apps/api/.env
```

`.env` は Git に載せない。ルートの `.gitignore` は `.env*` を無視し、`!.env.example` で見本だけを載せる。

`.env` は 3 か所から読まれる。

| 読む側 | 読み方 |
| --- | --- |
| Prisma CLI | `prisma.config.ts` の先頭の `import "dotenv/config"` |
| `pnpm --filter @kotoba/api dev` | `nest start --watch --exec "node --env-file-if-exists=.env"`。ファイルがなければ読まずに起動する |
| Vercel | `.env` は使わない。プロジェクトの環境変数に直接設定する |

## 4. Prisma の設定を置く

`apps/api/prisma.config.ts` — CLI の設定。Prisma 7 では接続先をスキーマではなくここに書く。

```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx src/prisma/seed/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL,
  },
});
```

`url` は `env("DIRECT_URL")` ではなく `process.env.DIRECT_URL` で読む。`env()` は変数がないと設定の読み込みごと失敗し、DB につながない `prisma generate` まで止まる（「つまずきポイント」参照）。

`apps/api/prisma/schema.prisma` — ジェネレーターとデータソース。

```prisma
generator client {
  provider               = "prisma-client"
  output                 = "../src/generated/prisma"
  runtime                = "nodejs"
  moduleFormat           = "esm"
}

datasource db {
  provider = "postgresql"
}
```

| 設定 | 理由 |
| --- | --- |
| `provider = "prisma-client"` | Prisma 7 のジェネレーター。TypeScript のソースを `output` に書き出す |
| `output` | `src` の下に置く。`rootDir` の外に出すと `tsc` がエラーになる |
| `moduleFormat = "esm"` | `apps/api` は `"type": "module"`。ESM で生成すると、生成物の中の相対 import に `.js` が付き、`moduleResolution: "node16"` でそのまま解決できる |

モデルの定義は `schema.prisma` の `Word` を参照する。列の選び方は ADR 0004 に従う。

## 5. Prisma Client を生成する

`apps/api/package.json` の `postinstall` で `prisma generate` を走らせる。`pnpm install` のたびに `src/generated/prisma` が作り直されるので、手で生成する必要はない。

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

生成物は `apps/api/.gitignore` で Git から外す。

```gitignore
/src/generated/
```

`schema.prisma` を書き換えたら、migration を作る（次節）か `pnpm --filter @kotoba/api exec prisma generate` で作り直す。

## 6. migration を作って流す

`schema.prisma` を変えたら、ローカルの DB に対して migration を作る。

```bash
pnpm db:migrate
```

`prisma migrate dev` が対話的に migration の名前を聞き、`apps/api/prisma/migrations/<日時>_<名前>/migration.sql` を作って DB に流す。名前は変更内容を英語の snake_case で付ける（例: `add_words`）。作られた `migration.sql` はコミットする。

既にある migration を流すだけなら `deploy` を使う。対話がなく、新しい migration は作らない。CI と本番はこちらを使う。

```bash
pnpm db:deploy
```

## 7. seed を流す

```bash
pnpm db:seed
```

`apps/api/src/prisma/seed/words.ts` の単語を `words` テーブルへ入れる。`id` で upsert するため、何度流しても同じ状態になる。流し終わると、DB にある件数を `words.ts` の語数と突き合わせ、合わなければ失敗する。

`src/prisma/seed/` は seed のためだけのコードで、アプリは実行時に読まない。`tsconfig.build.json` の `exclude` に入れ、`nest build` の成果物（`dist`）に含めない。単語を足す・直すときは `words.ts` を書き換えて seed を流し直す。デプロイは要らない。

ルートの `db:seed` は Turborepo 経由（`turbo run db:seed`）で実行する。`turbo.json` の `db:seed` タスクには 2 つの設定を置いている。

```jsonc
"db:seed": {
  "dependsOn": ["^build"],
  "passThroughEnv": ["DATABASE_URL", "DIRECT_URL"],
  "cache": false
}
```

| 設定 | 理由 |
| --- | --- |
| `dependsOn: ["^build"]` | `src/prisma/seed/words.ts` が `@kotoba/shared` のビルド済みの `dist` を読み込む。先に `packages/shared` をビルドさせる |
| `passThroughEnv` | Turborepo は宣言していない環境変数をタスクに渡さない。本番に流すときのように、シェルで接続先を渡せるようにする |

入ったデータは Supabase Studio（http://127.0.0.1:54323）の Table Editor で確かめられる。

## 8. NestJS から使う

`PrismaService` を 1 つだけ作り、注入して使う。`PrismaClient` はインスタンスごとに接続プールを持つため、各所で `new` しない。

```typescript
// apps/api/src/prisma/prisma.service.ts
import { Injectable, type OnModuleDestroy } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
```

```typescript
// apps/api/src/prisma/prisma.module.ts
import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

`AppModule` の `imports` に `PrismaModule` を加える。`@Global()` なので、ほかのモジュールは `imports` に書かずに `PrismaService` を注入できる。

```typescript
constructor(private readonly prisma: PrismaService) {}

const word = await this.prisma.word.findUnique({ where: { id: "lagom" } });
```

起動時に `$connect()` は呼ばない。接続は最初のクエリで張られるため、DB を使わないユニットテストは DB なしで起動できる。

出題する単語は `WordsModule` の `WordsService` から引く。`findById(id)` と、ゲーム開始時の 1 語を選ぶ `pick({ language, excludeWordIds })` を持つ。

| 振る舞い | 理由 |
| --- | --- |
| 結果をキャッシュせず、毎回 DB を引く | seed を流し直すだけで、デプロイなしに単語の変更が反映される |
| 読んだ行を `wordSchema` で検証し、通らない行は候補から外して id 付きのエラーログを出す | `jsonb` の中身の形は DB が保証しない（ADR 0004）。不正な 1 語のためにゲーム全体を止めない |
| 起動時、`DATABASE_URL` があれば全件を非同期に検証してログに出す | 不正な行にデプロイ直後に気づける。起動を待たせず、DB に届かなくても警告を出して起動を続ける |

進行中ゲームは `games` テーブルに置き、`GamesModule` が `GameStore` の実装として `PrismaGameStore` を渡す。

```typescript
// apps/api/src/games/games.module.ts
{
  provide: GAME_STORE,
  useFactory: (prisma: PrismaService) => new PrismaGameStore(prisma),
  inject: [PrismaService],
}
```

| 振る舞い | 理由 |
| --- | --- |
| `get` は `id` と `expires_at > 現在` で絞り、同じ UPDATE で `expires_at` を 1 時間先へ延ばす（`updateManyAndReturn`） | 期限内かの判定と期限の延長の間に、期限が切れる隙間を作らない |
| `create` は同じトランザクションで期限切れの行を消してから作る | 読まれないまま放置されたゲームを、定期実行なしで片付ける |
| 読んだ `history` と `result` を `packages/shared` のスキーマで検証する | `jsonb` の中身の形は DB が保証しない |
| migration で `games` の RLS をポリシーなしで有効にする | Supabase の Data API から、publishable key で秘密の単語を読まれたり行を書き換えられたりしないようにする。api はテーブルの所有者のロールで接続するため影響を受けない。Prisma のスキーマは RLS を表せないため、migration の SQL に書く |
| `useFactory` で組み立てる | テストが時刻を差し替える `now` 引数を、NestJS の注入の対象から外す |

DB を使わないユニットテストと HTTP のテストは、`overrideProvider(GAME_STORE)` でメモリ内の `MemoryGameStore` に差し替える。

## 9. CI で確かめる

`.github/workflows/ci.yml` の `db` ジョブが、PR ごとに次を流す。

```yaml
- run: pnpm db:start
- run: cp apps/api/.env.example apps/api/.env
- run: pnpm db:deploy
- name: Check migrations match the schema
  working-directory: apps/api
  run: pnpm exec prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
- run: pnpm db:seed
- run: pnpm test:db
```

| 手順 | 確かめること |
| --- | --- |
| `db:deploy` | コミットされた migration が、空の DB に最初から最後まで通る |
| `migrate diff --exit-code` | migration を流した DB と `schema.prisma` に差分がない。`schema.prisma` だけ変えて migration を作り忘れると、差分ありの終了コード 2 で失敗する |
| `db:seed` | 単語プールが `wordSchema` の形のまま DB に入り、件数が合う |
| `test:db` | seed した単語を、アプリ（`WordsService`）が seed データと同じ形で読み出せる。同じ DB を指す 2 つの api の間で、1 つのゲームを続けられる |

`e2e` ジョブも、実際の api を相手にするため同じ手順で seed 済みの DB を用意する（[testing.md](testing.md)）。`ci` ジョブは DB を使わない。`prisma generate` は DB につながないため、`DIRECT_URL` のない `pnpm install` でも `postinstall` が通る。

## 10. DB を使うテスト

DB を相手にするテストは `*.db.test.ts` と名付ける。通常の `pnpm test` からは外し、DB を立てた環境で `pnpm test:db` から流す。

```typescript
// apps/api/vitest.config.ts（通常のユニットテスト）
test: {
  include: ["src/**/*.test.ts"],
  exclude: ["src/**/*.db.test.ts"],
}
```

```typescript
// apps/api/vitest.db.config.ts（DB を使うテスト）
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [swc.vite()],
  test: {
    environment: "node",
    include: ["src/**/*.db.test.ts"],
    setupFiles: ["dotenv/config"],
    fileParallelism: false,
  },
});
```

| 設定 | 理由 |
| --- | --- |
| 設定ファイルを分ける | `mergeConfig` で `vitest.config.ts` を広げると、`include` と `exclude` が上書きされず連結され、DB を使うテストが除かれたままになる |
| `setupFiles: ["dotenv/config"]` | Vitest は `.env` を読まない。`DATABASE_URL` を `.env` から渡す |
| `fileParallelism: false` | テストファイルどうしが 1 つの DB を共有するため、並列に流さない |

`apps/api` の `test:db` スクリプトは `vitest run --config vitest.db.config.ts`。ルートの `pnpm test:db` は `turbo run test:db` で、`turbo.json` の `test:db` タスクに `db:seed` と同じ `dependsOn: ["^build"]` と `passThroughEnv` を置く。

手元では、DB を立てて seed してから流す。

```bash
pnpm db:start
pnpm db:deploy
pnpm db:seed
pnpm test:db
```

## 11. 本番の Supabase につなぐ

本番の Supabase プロジェクトは、Vercel へのデプロイと一緒に用意する。手順は次のとおり。

1. Supabase でプロジェクトを作る。Postgres のメジャーバージョンを `supabase/config.toml` の `major_version` と揃える
2. Supabase の SQL Editor で Prisma 専用のユーザーを作り、`public` スキーマの権限を与える。Supabase は Prisma にこの専用ユーザーを使うことを推奨している
3. プロジェクトの「Connect」から接続文字列を 2 つ取り、ユーザーとパスワードを手順 2 のものに差し替える
   - トランザクションプーラー（ポート 6543）。末尾に `?pgbouncer=true` を付けて `DATABASE_URL` にする
   - 直接接続かセッションプーラー（ポート 5432）を `DIRECT_URL` にする
4. Vercel のプロジェクトの環境変数に `DATABASE_URL` と `DIRECT_URL` を設定する
5. デプロイの前に `prisma migrate deploy` を本番の `DIRECT_URL` で流し、続けて `prisma db seed` で単語を入れる

## 日々の操作

| やりたいこと | コマンド |
| --- | --- |
| ローカルの DB を起動 / 停止 | `pnpm db:start` / `pnpm db:stop` |
| スキーマを変えて migration を作る | `pnpm db:migrate` |
| migration を流すだけ | `pnpm db:deploy` |
| 単語を入れ直す | `pnpm db:seed` |
| DB を使うテストを流す | `pnpm test:db` |
| DB を空にして migration と seed をやり直す | `pnpm --filter @kotoba/api exec prisma migrate reset` のあと `pnpm db:seed` |
| DB の中身を見る | http://127.0.0.1:54323（Supabase Studio） |
| 接続情報を表示する | `pnpm --filter @kotoba/api exec supabase status` |

## つまずきポイント

### Prisma 8 の RC が入る

**症状**: `pnpm add prisma` で `8.0.0-rc.*` が入り、`@prisma/client` 7 系とバージョンがずれる。

**原因**: npm の `prisma` の `latest` タグが RC 版を指している。`@prisma/client` の `latest` は 7 系のため、指定せずに入れると 2 つが揃わない。

**対処**: `prisma@^7.10.0` のようにバージョンを指定して入れる。`prisma`・`@prisma/client`・`@prisma/adapter-pg` を同じバージョンで揃える。

### DIRECT_URL がないと prisma generate が落ちる

**症状**: `.env` のない環境（CI のビルドジョブなど）の `pnpm install` で、`postinstall` が `PrismaConfigEnvError: Cannot resolve environment variable: DIRECT_URL` で失敗する。

**原因**: `prisma.config.ts` で `env("DIRECT_URL")` を使っている。`env()` は変数がないと設定の読み込み自体を失敗させ、DB につながない `generate` も巻き込む。

**対処**: `url: process.env.DIRECT_URL` と書く。値がなくても設定は読み込め、DB につなぐコマンドだけが接続時に失敗する。

### .env がないと API が起動しない

**症状**: `nest start --env-file .env` にすると、`.env` のない環境（DB を使わずに api を起動するときなど）で `node: .env: not found` と出て起動しない。

**原因**: Nest CLI の `--env-file` は Node.js の `--env-file` に渡され、ファイルがないと Node.js が起動を拒む。

**対処**: `nest start --watch --exec "node --env-file-if-exists=.env"` にする。ファイルがあれば読み、なければ読まずに起動する。

### seed が @kotoba/shared を解決できない

**症状**: `pnpm --filter @kotoba/api db:seed` が `Cannot find module '@kotoba/shared'` で落ちる。

**原因**: `@kotoba/shared` はビルド済みの `dist` を公開している。クローン直後など `packages/shared` が未ビルドだと、`src/prisma/seed/words.ts` がそれを読み込めない。

**対処**: ルートの `pnpm db:seed`（`turbo run db:seed`）で実行する。`turbo.json` の `dependsOn: ["^build"]` が先に `packages/shared` をビルドする。

### supabase start がイメージの取得で止まる

**症状**: 初回の `pnpm db:start` が、何十分経っても `Pulling images...` から進まない。Docker の通信量も 0 のまま。

**原因**: `supabase start` は 10 個以上のイメージを同時に取得する。回線が細い環境では、同時の取得がそろって止まることがある。

**対処**: `pnpm db:start` を止め、イメージを 1 つずつ取得してから起動し直す。取得しようとしているイメージは、`supabase start` の実行中に `ps aux | grep "docker pull"` で一覧できる。

```bash
docker pull public.ecr.aws/supabase/postgres:<バージョン>
```

### シェルで渡した接続先が seed に届かない

**症状**: `DIRECT_URL=<本番の URL> pnpm db:seed` のようにシェルで接続先を渡しても、`.env` の接続先（ローカル）につながる。ローカルの Supabase が止まっていると `DatabaseNotReachable` で落ちる。

**原因**: Turborepo は `turbo.json` で宣言していない環境変数をタスクに渡さない。シェルの値が消え、`prisma.config.ts` の `dotenv` が `.env` の値を読む。

**対処**: `turbo.json` の `db:seed` に `passThroughEnv: ["DATABASE_URL", "DIRECT_URL"]` を置く。
