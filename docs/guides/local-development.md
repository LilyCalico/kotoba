# ローカル開発の手順

`pnpm dev` で web と api を起動し、ブラウザから実際の API を相手にゲームを 1 周遊べる状態にするまでの手順。DB の構成そのものは [prisma-supabase.md](prisma-supabase.md)、E2E の構成は [testing.md](testing.md) を参照する。

## このリポジトリでの前提

| 項目 | 値 | 理由 |
| --- | --- | --- |
| web | `http://localhost:3000`（`next dev`） | Next.js の既定のポート |
| api | `http://localhost:3001`（`nest start --watch`） | `apps/api/src/main.ts` の既定。`PORT` で変えられる |
| `/api/v1` の届け方 | `next dev` が `/api/v1/*` を api へ中継する | 本番と同じく、画面は相対パス `/api/v1` だけを叩く |
| DB | ローカルの Supabase（Docker） | api は出題する単語を DB から引く。seed 済みでないとゲームを始められない |
| AI | Gemini API（`apps/api/.env` の `GEMINI_API_KEY`） | 質問への回答に使う。キーがなくてもゲームは始まるが、質問と誤答は「もう一度送ってね」になる |
| 単語の出題 | 常に `apps/api` から。モックの `GameClient` は Storybook とユニットテストだけで使う | 画面と API のずれを開発中に気づける |

## 1. DB を用意する

Docker を起動してから、ルートで次を流す。初回は Supabase のイメージの取得に数分かかる。

```bash
pnpm db:start
cp apps/api/.env.example apps/api/.env
pnpm db:deploy
pnpm db:seed
```

| コマンド | 役割 |
| --- | --- |
| `db:start` | ローカルの Supabase を立てる。PostgreSQL は `127.0.0.1:54322` で待ち受ける |
| `cp .env.example .env` | api の接続先（`DATABASE_URL` / `DIRECT_URL`）をローカルの Supabase に向ける |
| `db:deploy` | migration を流してテーブルを作る |
| `db:seed` | `apps/api/src/prisma/seed/words.ts` の単語を入れる |

2 回目以降は `pnpm db:start` だけでよい。DB の中身はコンテナを止めても残る。

## 2. Gemini の API キーを置く

[Google AI Studio](https://aistudio.google.com/apikey) でキーを発行し、`apps/api/.env` の `GEMINI_API_KEY` に書く。設定できる項目は [gemini.md](gemini.md) を参照する。

```bash
# apps/api/.env
GEMINI_API_KEY="<発行したキー>"
```

正規化マッチで正解する入力とヒント・ギブアップは AI を呼ばないため、キーがなくても動く。

## 3. web と api を起動する

```bash
pnpm dev
```

Turborepo が web と api の `dev` を並べて起動する。`http://localhost:3000` を開き、起動画面の打ち込みが終わるか Skip を押してから、Start a game でゲームを始める。

## 4. `/api/v1` が api に届く仕組み

本番では Vercel Services が `/api/v1/(.*)` を api サービスへ直接振り分けるため、リクエストは Next.js に届かない。ローカルではこの振り分けを Next.js の rewrites が肩代わりする。

```typescript
// apps/web/next.config.ts
function apiProxyOrigin(phase: string): string | undefined {
  if (process.env.API_PROXY_ORIGIN) return process.env.API_PROXY_ORIGIN;
  return phase === PHASE_DEVELOPMENT_SERVER ? DEV_API_ORIGIN : undefined;
}
```

| 状況 | 中継先 |
| --- | --- |
| `API_PROXY_ORIGIN` を指定した | その値 |
| `next dev`（`pnpm dev`） | `http://localhost:3001` |
| `next build` / `next start` | 中継しない |

ビルドで中継しないのは、本番でこの中継が働くと `localhost:3001` へ送ろうとして壊れるためである。Vercel では `API_PROXY_ORIGIN` を設定しない。

## 5. 出題済みの記録を消す

答えを見た単語の id は、ブラウザの `localStorage` の `kotoba:played-words` に残り、次のゲームの開始で `excludeWordIds` として api に送られる。同じ単語を出したいときは、開発者ツールのコンソールで消す。

```javascript
localStorage.removeItem("kotoba:played-words");
```

## つまずきポイント

### ゲームを始めると「Couldn't start a game.」が出る

**症状**: `/play` を開くと、設問が出ずに「Couldn't start a game.」のトーストが出る。

**原因**: api が単語を引けていない。

| 状況 | 見え方 |
| --- | --- |
| DB が起動していない、または `apps/api/.env` がない | api のログに Prisma の接続エラーが出て、`POST /api/v1/games` が `internal_error` になる |
| seed を流していない | `POST /api/v1/games` が `validation_error`（`detail` は `No words are available for "sv".`）になる。開発者ツールのネットワークタブで応答を見る |

**対処**: 「1. DB を用意する」を流し直す。`.env` を作ったあとは api の再起動が要る。

### ポート 3001 がほかのプロセスに使われている

**症状**: api が `EADDRINUSE: address already in use :::3001` で起動しない。あるいは別のアプリが 3001 で動いていて、`/api/v1` への呼び出しがそちらに届く。

**原因**: api と web の中継先は、どちらも既定で 3001 を使う。

**対処**: api のポートと中継先を揃えて変える。

```bash
PORT=3101 pnpm --filter @kotoba/api dev
API_PROXY_ORIGIN=http://localhost:3101 pnpm --filter @kotoba/web dev
```

### worktree で api が DB につながらない

**症状**: git worktree で `pnpm dev` を起動すると、api が DB に接続できない。

**原因**: `apps/api/.env` は Git の管理外なので、worktree には作られない。

**対処**: メインのチェックアウトの `apps/api/.env` を、worktree の同じ場所にシンボリックリンクで置く。`GEMINI_API_KEY` も含めて 1 か所で管理できる。DB は Supabase のコンテナを共有するため、`db:start` / `db:seed` は流し直さなくてよい。

```bash
ln -s <メインのチェックアウト>/apps/api/.env apps/api/.env
```
