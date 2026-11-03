# テスト環境の設定手順

`packages/shared` / `apps/api` / `apps/web` にユニットテストを、`e2e` に E2E を用意するまでの手順。何をどこまでテストするか、なぜこの構成かは [ADR 0002](../adr/0002-vitest-and-playwright-for-testing.md) を参照する。

## このリポジトリでの前提

| 項目 | 値 | 理由 |
| --- | --- | --- |
| テストランナー | Vitest | 全ワークスペースで共通。`apps/api` が ESM のため |
| テストファイル | `*.test.ts` を実装の隣に置く | 対象と同じディレクトリにあるほうが追随漏れが起きにくい |
| 描画の確認 | コンポーネント単体は Storybook、フローは E2E | `apps/web` には描画を伴うテストを置かない |
| E2E | `e2e/tests/*.spec.ts` | `.spec` と `.test` で E2E とユニットを見分ける |
| `test` スクリプト | `vitest run` | `vitest` 単体は監視モードに入り、CI が終わらない |

## 1. ユニットテストの依存を入れる

```bash
pnpm --filter @kotoba/shared add -D vitest @vitest/coverage-v8
pnpm --filter @kotoba/api add -D vitest @vitest/coverage-v8 unplugin-swc @swc/core @nestjs/testing supertest @types/supertest
pnpm --filter @kotoba/web add -D vitest @vitest/coverage-v8
```

| パッケージ | 役割 |
| --- | --- |
| `unplugin-swc` | Vitest のトランスパイラを SWC に差し替える。`apps/api` だけに要る |
| `@nestjs/testing` | `Test.createTestingModule()` でモジュールを組み立て、プロバイダーを差し替える |
| `supertest` | 起動した Nest アプリケーションに HTTP リクエストを投げる |

`apps/web` にブラウザ環境の依存（`jsdom`、Testing Library）は入れない。コンポーネント単体の確認は Storybook、画面をまたぐフローは E2E が担い、`apps/web` の Vitest はコンポーネントの外に切り出したロジックだけを対象にする。判断の根拠は [ADR 0002](../adr/0002-vitest-and-playwright-for-testing.md) を参照する。

`@swc/core` は `pnpm-workspace.yaml` の `ignoredBuiltDependencies` に入れる。ネイティブバインディングはプラットフォーム別の `optionalDependencies` として配られるため、`postinstall` を走らせなくても解決できる。

## 2. 各ワークスペースに設定を置く

### `packages/shared`

```typescript
// packages/shared/vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/index.ts"],
    },
  },
});
```

### `apps/api`

```typescript
// apps/api/vitest.config.ts
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [swc.vite()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["src/**/*.db.test.ts"],
  },
});
```

DB を使うテストは `*.db.test.ts` と名付けて通常のユニットテストから外し、DB を立てた環境でだけ別の設定で流す。手順は [prisma-supabase.md「DB を使うテスト」](prisma-supabase.md#10-db-を使うテスト) を参照する。

`swc.vite()` に引数は要らない。`unplugin-swc` は変換対象ファイルの位置から `tsconfig.json` を探し、`experimentalDecorators` が有効なら SWC の `legacyDecorator` と `decoratorMetadata` を自動で立てる。

### `apps/web`

```typescript
// apps/web/vitest.config.mts
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
```

`environment` は `jsdom` ではなく `node` にする。対象が描画を伴わないロジックに限られるため、DOM の実装を読み込む必要がない。拡張子も `.ts` だけを拾い、`.tsx` は対象外にする。

`apps/web` にまだテストが 1 件もない間は、`test` スクリプトに `--passWithNoTests` を付ける。Vitest は対象 0 件を失敗として扱うため、これがないと CI が赤になる。最初のテストを置いた時点で外す。

## 3. テストをビルド成果物から除く

`apps/api` と `packages/shared` の `tsconfig.json` は `src/**/*.ts` を対象にしているため、そのままだとテストが `dist/` に出力される。ビルド専用の設定を足して除外する。

```json
// apps/api/tsconfig.build.json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "src/**/*.test.ts"]
}
```

`apps/api` は設定ファイルを置くだけでよい。`nest build` は `tsconfig.build.json` が存在すればそちらを優先する（`@nestjs/cli` の `getDefaultTsconfigPath`）。`packages/shared` は明示する。

```json
// packages/shared/package.json
{
  "scripts": {
    "build": "tsc -p tsconfig.build.json"
  }
}
```

`typecheck`（`tsc --noEmit`）は `tsconfig.json` を使い続ける。テストコードも型検査の対象に残す。

## 4. スクリプトを揃える

各ワークスペースの `package.json` に同じ名前で並べる。

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

## 5. E2E ワークスペースを作る

`e2e` をルート直下に置き、`pnpm-workspace.yaml` に登録する。

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "e2e"
```

```bash
pnpm --filter @kotoba/e2e add -D @playwright/test typescript@^6 @types/node@^24
pnpm --filter @kotoba/e2e exec playwright install --with-deps chromium
```

`playwright.config.ts` の `webServer` で、Gemini のスタブ・api・web を起動する。api の Gemini の接続先はスタブへ向ける（[gemini.md](gemini.md) の「5. E2E ではスタブサーバーに向ける」）。

```typescript
webServer: [
  {
    command: "node gemini-stub.js",
    port: 3002,
    env: { GEMINI_STUB_PORT: "3002" },
    reuseExistingServer: !isCI,
  },
  {
    command: "pnpm --filter @kotoba/api dev",
    cwd: "..",
    env: { GEMINI_API_KEY: "e2e-stub", GEMINI_BASE_URL: "http://localhost:3002" },
    port: 3001,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
  {
    command: "pnpm --filter @kotoba/web dev",
    cwd: "..",
    url: "http://localhost:3000",
    env: { API_PROXY_ORIGIN: "http://localhost:3001" },
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
],
```

## 6. 開発時だけ `/api/v1` を api へ中継する

本番では Vercel Services が `/api/v1/(.*)` を api サービスへ直接振り分けるため、リクエストは Next.js に届かない。ローカルと E2E では Next.js の rewrites が肩代わりする。

```typescript
// apps/web/next.config.ts
function apiProxyOrigin(phase: string): string | undefined {
  if (process.env.API_PROXY_ORIGIN) return process.env.API_PROXY_ORIGIN;
  return phase === PHASE_DEVELOPMENT_SERVER ? DEV_API_ORIGIN : undefined;
}

export default function config(phase: string): NextConfig {
  const origin = apiProxyOrigin(phase);

  return {
    async rewrites() {
      if (!origin) {
        return [];
      }

      return [
        {
          source: "/api/v1/:path*",
          destination: `${origin}/api/v1/:path*`,
        },
      ];
    },
  };
}
```

`next dev` では `API_PROXY_ORIGIN` がなくても `http://localhost:3001` へ中継し、`next build` では中継しない。本番でこの中継が働くと `localhost:3001` へ送ろうとして壊れるためである。Vercel では `API_PROXY_ORIGIN` を設定しない。E2E は `webServer` の `env` で中継先を明示する。

## 7. Turborepo に繋ぐ

```json
{
  "tasks": {
    "test": { "dependsOn": ["^build"] },
    "test:coverage": { "dependsOn": ["^build"], "outputs": ["coverage/**"] },
    "test:e2e": { "dependsOn": ["@kotoba/shared#build"], "cache": false }
  }
}
```

`test:e2e` が `^build` ではなく `@kotoba/shared#build` を指すのは、web と api が dev サーバーとして自分で再コンパイルするためである。事前に要るのは、両者が `dist/` 経由で読み込む `packages/shared` のビルドだけになる。

## 8. E2E を seed 済みの DB で流す

E2E は web のモックを使わず、実際の api を相手にする。api は出題する単語を DB から引くため、E2E の前に seed 済みのローカル DB が要る（[local-development.md](local-development.md) の「1. DB を用意する」）。AI の判定だけは、決まった規則で応答する Gemini のスタブが受け持ち、Gemini のキーは要らない。

CI の `e2e` ジョブも、`db` ジョブと同じ手順で DB を用意してから流す。

```yaml
- run: pnpm db:start
- run: cp apps/api/.env.example apps/api/.env
- run: pnpm db:deploy
- run: pnpm db:seed
- run: pnpm test:e2e
```

出題する単語は、`localStorage` の出題済みの記録で絞る。api は記録した単語を出題から除くので、seed の単語のうち 1 語以外を記録しておけば、その 1 語が出る。テスト専用の API の口は作らない。秘密の単語を固定・取得できる口を本番に載せないためである。

api はゲーム開始と入力をクライアントの IP ごとに数えて制限する（[api.md](../specifications/api.md) の「レートリミット」）。E2E のリクエストはどれも同じ接続元から届くため、そのままでは全テストが 1 つの枠を分け合い、並列に走るとゲーム開始の上限（1 分に 10 回）を超える。そこで spec は `@playwright/test` ではなく `tests/fixtures.ts` の `test` を使い、テストごとに違う IP を `x-forwarded-for` で名乗らせる。web の rewrite はこのヘッダーを書き換えずに api へ渡す。

```typescript
// e2e/tests/fixtures.ts
export const test = base.extend({
  extraHTTPHeaders: async ({ extraHTTPHeaders }, use) => {
    await use({
      ...extraHTTPHeaders,
      "x-forwarded-for": `198.18.${randomInt(256)}.${randomInt(1, 255)}`,
    });
  },
});
```

上限を緩めるフラグや環境変数は設けない。本番に制限を外す経路を載せないためである。

DB を使う api のテスト（`*.db.test.ts`）も同じ理由で、ゲームを始めるリクエストに実行ごとに選び直した IP を付け、作ったカウンタを最後に消す。

```typescript
// e2e/tests/game.spec.ts
import { words } from "../../apps/api/src/prisma/seed/words.js";

async function playWithOnly(page: Page, ...unplayed: string[]) {
  const played = words.map((word) => word.id).filter((id) => !unplayed.includes(id));
  await page.addInitScript(/* localStorage の kotoba:played-words に played を入れる */);
}
```

単語の一覧は seed の入力データから読む。seed に単語を足しても、記録する id が自動で増えるため、出題は絞られたまま変わらない。

## 9. 実行する

```bash
pnpm test           # 全ワークスペースのユニットテスト
pnpm test:coverage  # カバレッジ付き
pnpm test:e2e       # E2E（web と api は Playwright が起動する。seed 済みの DB が要る）
pnpm test:db        # DB を使うテスト（ローカルの Supabase に seed 済みであること）
```

`e2e` には `test` スクリプトがないため、`pnpm test` に E2E は含まれない。

## つまずきポイント

### 注入されたプロパティが undefined になる

**症状**: `apps/api` のテストで `Nest can't resolve dependencies of the ...Controller (?)` が出る。あるいは DI は通るのに注入先が `undefined`。

**原因**: Vitest 既定のトランスパイラである esbuild が `emitDecoratorMetadata` を実装していない。型情報がコンパイル後に残らず、NestJS が何を注入すべきか判別できない。

**対処**: `vitest.config.ts` の `plugins` に `swc.vite()` を入れる。`unplugin-swc` が `esbuild: false` を設定したうえで SWC に変換を任せる。

### CI が終わらない

**症状**: `pnpm test` がテスト完了後もプロセスを握ったままになる。

**原因**: `vitest` は引数なしで実行すると監視モードに入る。

**対処**: `test` スクリプトを `vitest run` にする。監視実行は `test:watch` として分ける。

### `dist/` にテストファイルが混ざる

**症状**: ビルド後の `dist/` に `*.test.js` が出力される。`packages/shared` では `files: ["dist"]` を通じて配布物にも入る。

**原因**: `tsconfig.json` の `include` が `src/**/*.ts` であり、テストファイルも対象に入っている。

**対処**: `tsconfig.build.json` を置いて `src/**/*.test.ts` を `exclude` する。`nest build` は自動でそちらを使う。`tsc` を直接呼ぶワークスペースは `-p tsconfig.build.json` を付ける。

### `apps/web` の Vitest がテストを 1 件も見つけずに落ちる

**症状**: `No test files found` で `pnpm test` が失敗する。

**原因**: Vitest は対象 0 件を失敗として扱う。`apps/web` はコンポーネントの外に切り出したロジックだけを対象にするため、その関数が生まれるまでテストが存在しない。

**対処**: `test` スクリプトに `--passWithNoTests` を付ける。最初のテストを置いた時点で外す。

### Playwright の webServer が api の起動を待てない

**症状**: `Timed out waiting 60000ms from config.webServer` で E2E が始まらない。

**原因**: `webServer.url` はレスポンスの状態コードが 2xx / 3xx になるまで待つ。api のルートはすべて POST で、Playwright が送る GET にはどのパスでも 404 を返すため、条件を満たさない。

**対処**: `url` ではなく `port` を指定する。ポートが接続を受け付けた時点で起動完了と見なされる。

### E2E で api への到達を状態コードでは判定できない

**症状**: `/api/v1/...` が api に届いているか確かめようとして、存在しないパスの 404 を期待しても、届いたかどうか区別できない。

**原因**: web も api も、存在しないパスには 404 を返す。

**対処**: `Content-Type` を見る。api は失敗を Problem Details（`application/problem+json`）で返し、Next.js は HTML を返す。

### LayoutProps / PageProps が見つからない

**症状**: `apps/web` の型検査が `error TS2304: Cannot find name 'LayoutProps'` で落ちる。ローカルでは通るのに CI だけ失敗する。

**原因**: `LayoutProps` と `PageProps` は Next.js がルート構成から生成するグローバル型で、実体は `.next/types/` に出力される。生成は `next dev` / `next build` / `next typegen` の実行時に行われるため、ビルド前に型検査を走らせると存在しない。ローカルで通るのは、以前の開発サーバー起動やビルドで `.next/` が残っているためである。

**対処**: `typecheck` スクリプトを `next typegen && tsc --noEmit` にする。`next typegen` はフルビルドを伴わずに型定義だけを生成する。タスクの実行順に依存しなくなる。

### `pnpm typecheck` が tsc not found で落ちる

**症状**: `e2e` の `typecheck` が `sh: tsc: command not found` で失敗し、他のワークスペースのタスクも巻き添えで中断する。

**原因**: pnpm は依存を巻き上げない。`typescript` を持たないワークスペースからは `tsc` が見えない。turbo は 1 つのタスクが失敗すると実行中の他タスクを打ち切るため、原因のワークスペース以外も失敗して見える。

**対処**: `typecheck` スクリプトを持つワークスペースが自分で `typescript` を宣言する。
