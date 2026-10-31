# Vercel へのデプロイの手順

`apps/web` と `apps/api` を、Vercel Services で 1 つのプロジェクトの 2 サービスとしてデプロイする手順。ブランチを push するとプレビューが、`main` にマージすると本番がデプロイされる。

## このリポジトリでの前提

| 項目 | 値 | 理由 |
| --- | --- | --- |
| プロジェクト | `yuriodas-projects/kotoba` | 個人スコープ（Hobby）に置く |
| 構成 | Vercel Services（`vercel.json` の `services`） | web と api が同じ deployment としてシップされ、プレビューでもフロントとバックが常に揃う |
| Root Directory | `.`（リポジトリのルート） | `vercel.json` をルートに置き、サービスごとの `root` で `apps/web` と `apps/api` を指す |
| 本番ブランチ | `main` | それ以外のブランチの push はプレビューになる |
| Node.js | 24.x | CI（`.github/workflows/ci.yml`）と揃える。プロジェクトの設定で指定する |
| 関数のリージョン | `hnd1`（東京） | DB（Supabase の東京リージョン）の近くで動かす。`vercel.json` の `regions` で指定する |
| DB | Supabase（東京リージョン）。プレビューと本番で同じ DB を使う | 手順は [prisma-supabase.md](prisma-supabase.md) の「本番の Supabase につなぐ」 |
| デプロイの保護 | Vercel Authentication（カスタムドメイン以外のすべて） | プロジェクトの既定。Vercel にログインしたメンバーだけが開ける |

## vercel.json

```json
{
  "regions": ["hnd1"],
  "services": {
    "web": {
      "root": "apps/web",
      "framework": "nextjs",
      "buildCommand": "cd ../.. && pnpm turbo run build --filter=@kotoba/web"
    },
    "api": {
      "root": "apps/api",
      "framework": "nestjs",
      "entrypoint": "src/main.ts",
      "buildCommand": "cd ../.. && pnpm turbo run build --filter=@kotoba/api^..."
    }
  },
  "rewrites": [
    { "source": "/api/v1/(.*)", "destination": { "service": "api" } },
    { "source": "/(.*)", "destination": { "service": "web" } }
  ]
}
```

| 設定 | 理由 |
| --- | --- |
| `framework` | ルートに Next.js・Vite・Storybook が並び、自動検出では決まらない。サービスごとに明示する |
| web の `buildCommand` | turbo の `dependsOn: ["^build"]` で、`next build` の前に `packages/shared` をビルドする |
| api の `buildCommand` | `--filter=@kotoba/api^...` で、api が依存するパッケージ（`packages/shared`）だけをビルドする。api 本体は Vercel の NestJS ビルダーが `src/main.ts` から rolldown でバンドルする（「つまずきポイント」参照） |
| api の `entrypoint` | Vercel はビルドの前に入口の存在を確かめる。ビルド前からある `src/main.ts` を指す |
| `rewrites` | `/api/v1/(.*)` を api に、それ以外を web に向ける。Next.js 自身の `/api` とぶつからないよう、api にはサブ名前空間を割り当てる。api は `setGlobalPrefix("/api/v1")` で接頭辞を受ける（[nestjs.md](nestjs.md)） |

web の `next.config.ts` は、本番では `/api/v1` を中継しない。リクエストは Vercel の `rewrites` で api に届き、Next.js には来ない（[local-development.md](local-development.md)）。

## 1. CLI でログインする

```bash
npm install -g vercel
vercel login
```

## 2. プロジェクトを作り、リポジトリとつなぐ

リポジトリのルートで実行する。プロジェクトがなければ作り、GitHub リポジトリとつなぐ。

```bash
vercel link --yes --project kotoba --scope yuriodas-projects
```

`.vercel/` と、ローカル開発用の `VERCEL_OIDC_TOKEN` を書いた `.env.local` ができる。どちらも `.gitignore` 済み。

Node.js のバージョンを CI と揃える。

```bash
vercel api /v9/projects/kotoba -X PATCH --input - <<< '{"nodeVersion":"24.x"}'
```

## 3. 環境変数を登録する

api が実行時に読む 2 つを、本番とプレビューに登録する。値は Supabase と Google AI Studio から取り、`apps/api/.env.production`（`.gitignore` 済み）に書いておく。

| 変数 | 内容 |
| --- | --- |
| `DATABASE_URL` | Supabase のトランザクションプーラー（ポート 6543、末尾に `?pgbouncer=true`） |
| `GEMINI_API_KEY` | 本番用の Gemini API キー。CI の eval 用キー（`GEMINI_API_KEY_TEST`）とは分ける |

`DIRECT_URL` は migration と seed だけが使い、手元から流すため Vercel には登録しない。`GEMINI_MODEL` は省けば既定のモデルになり、`GEMINI_BASE_URL` と `API_PROXY_ORIGIN` はローカルと E2E だけで使う。

値を画面や引数に出さないよう、ファイルから標準入力で渡す。

```bash
(
  set -a; source apps/api/.env.production; set +a
  for name in DATABASE_URL GEMINI_API_KEY; do
    printf '%s' "${!name}" | vercel env add "$name" --environment production,preview --sensitive --yes --force
  done
)
vercel env ls
```

## 4. 本番の DB に migration と seed を流す

`apps/api/.env.production` の接続先で流す。turbo の `passThroughEnv` が、シェルの `DATABASE_URL` と `DIRECT_URL` をタスクに渡す。

```bash
(
  set -a; source apps/api/.env.production; set +a
  pnpm db:deploy
  pnpm db:seed
)
```

## 5. デプロイする

| きっかけ | デプロイ |
| --- | --- |
| `main` 以外のブランチへの push | プレビュー。PR には Vercel のボットがプレビューの URL をコメントする |
| `main` へのマージ | 本番 |

プレビューの URL は 1 デプロイ 1 ホストで、web も api も同じホストに載る。フロントが相対パス `/api/v1` を叩くと、常に自分のデプロイの api に届く。

## 6. 動作を確かめる

デプロイは Vercel Authentication で保護されている。ブラウザでは Vercel にログインしていれば開ける。

コマンドからは `vercel curl` を使う。応答の `x-vercel-id` は `<入口のリージョン>::<関数のリージョン>::…` の形で、関数が `hnd1` で動いたことを確かめられる。

```bash
vercel curl https://<デプロイの URL>/api/v1/games -- -s -D - -X POST \
  -H 'content-type: application/json' -d '{"language":"sv"}'
```

Playwright などで自動操作するときは、`.env.local` の `VERCEL_OIDC_TOKEN` を `x-vercel-trusted-oidc-idp-token` ヘッダーに載せる。同じプロジェクトのプレビューには、この設定だけで入れる。トークンはログやスクリーンショットに出さない。

```js
const context = await browser.newContext({
  extraHTTPHeaders: { "x-vercel-trusted-oidc-idp-token": process.env.VERCEL_OIDC_TOKEN },
});
```

```bash
node --env-file=.env.local <スクリプト>
```

## 日々の操作

| やりたいこと | 手順 |
| --- | --- |
| デプロイの一覧を見る | `vercel ls kotoba` |
| ビルドのログを見る | `vercel inspect <URL> --logs` |
| 実行時のログを見る | `vercel logs --deployment <URL>` |
| 手元で Vercel と同じビルドを試す | `vercel pull --yes --environment preview` のあと `vercel build` |
| migration を足した変更を出す | develop にマージしたら、手順 4 の `pnpm db:deploy` を流す。プレビューと本番は同じ DB を使うため、流すまでは新しいテーブルを使う API が両方で落ちる |
| 環境変数を変える | `apps/api/.env.production` を書き換え、手順 3 を流し直す。反映は次のデプロイから |

## つまずきポイント

### api のビルドで api 本体もビルドすると、関数が起動しない

**症状**: デプロイは成功するが、api が `FUNCTION_INVOCATION_FAILED` の 500 を返す。実行時のログに `SyntaxError: Cannot use import statement outside a module`、または `Cannot find package '@nestjs/core' imported from /var/task/main.js` が出る。

**原因**: Vercel の NestJS ビルダーは、ビルドコマンドのあとに `dist` などの出力があると、その中身を関数のルートに平らに置く。`apps/api/package.json` の `"type": "module"` が `main.js` に届かず、pnpm の `node_modules` のシンボリックリンクも関数のルートからは辿れない。

**対処**: api の `buildCommand` は依存パッケージだけをビルドする（`--filter=@kotoba/api^...`）。`dist` がなければ、ビルダーは `src/main.ts` から rolldown でバンドルし、依存の解決とデコレーターのメタデータを扱う。

### 入口に dist/main.js を指定すると、ビルドが始まらない

**症状**: ビルドが `[ENTRYPOINT_NOT_FOUND] Service "api" has entrypoint "dist/main.js" but that path does not exist.` で落ちる。

**原因**: Vercel はビルドコマンドを流す前に入口の存在を確かめる。

**対処**: ビルド前からある `src/main.ts` を指す。

### デプロイを開くと Vercel のログイン画面になる

**症状**: `curl` が `401`（`Protected deployment`）を返し、ブラウザは Vercel のログインへ飛ぶ。

**原因**: プロジェクトの既定で、カスタムドメイン以外のデプロイが Vercel Authentication で保護されている。

**対処**: 保護は外さない。コマンドは `vercel curl`、自動操作は `x-vercel-trusted-oidc-idp-token` ヘッダーで通す（手順 6）。

### 最初のデプロイが、本番ブランチ以外から本番になる

**症状**: プロジェクトを作って最初に push したブランチのデプロイが、`main` でないのに Production になる。

**原因**: Vercel は、本番のデプロイがまだないプロジェクトの最初のデプロイを本番にする。

**対処**: 2 回目以降の push はプレビューになる。本番は `main` へのマージで置き換わる。
