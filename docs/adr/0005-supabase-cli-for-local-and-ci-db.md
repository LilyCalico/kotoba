# ローカル開発と CI の DB を Supabase CLI で立てる

## ステータス

採用

## コンテキスト

本番の DB は Supabase の PostgreSQL で、`apps/api` が Prisma でつなぐ。開発と CI でも、Prisma の migration と seed を流せる PostgreSQL が要る。

CI では PR ごとに、空の DB へ migration と seed が最後まで通ることと、`schema.prisma` と migration に差分がないことを確かめる。壊れた migration に本番への適用で気づくと、デプロイが止まるためである。

`docs/specifications/game.md` の「実装予定の機能」には認証があり、技術スタックは Supabase を DB と Auth の両方に使う前提にしている。

## 決定

ローカル開発と CI の両方で、Supabase CLI の `supabase start` で Supabase のローカル環境一式を Docker 上に立てる。

| 項目 | 内容 |
| --- | --- |
| CLI の入れ方 | `apps/api` の devDependency（npm の `supabase`）。`pnpm install` で全員が同じバージョンになり、Renovate が更新する |
| 設定 | `apps/api/supabase/config.toml`。Postgres のメジャーバージョンは本番に合わせる |
| テーブルの定義 | Prisma の migration（`apps/api/prisma/migrations`）だけが持つ。Supabase CLI の migration と seed は無効にする |
| CI | `db` ジョブで `supabase start` → `prisma migrate deploy` → `prisma migrate diff` → `prisma db seed` → DB を使うテスト（`pnpm test:db`） |

本番の Supabase プロジェクトと、本番 DB への `prisma migrate deploy` は、Vercel へのデプロイの仕組みを作るときに用意する。

## 検討した選択肢

### Docker で素の PostgreSQL を立てる

`docker compose` か CI の `services` で PostgreSQL のコンテナを 1 つ立てる。軽く、CI の起動も速い。

ただし手元にあるのは素の PostgreSQL だけで、Supabase が持つ拡張・ロール・Auth は手元で動かない。認証を入れる段階で構成を作り直すことになる。

### クラウドの Supabase の開発用プロジェクトにつなぐ

Docker が要らず、準備がもっとも早い。

ただしオフラインでは開発できず、手元と CI が 1 つの DB を共有するため、migration の試行やテストのデータが互いに干渉する。無料プランのプロジェクトは使わない期間が続くと停止する。

### CI だけ Supabase の Postgres イメージを 1 つ立てる

ローカルは Supabase CLI、CI は `supabase/postgres` のコンテナ 1 つにする。CI は速いが、手元と CI で立ち上げ方と構成が分かれ、片方でだけ起きる問題を生む。

### ローカルと CI の両方で Supabase CLI（採用）

手元・CI・本番が同じ Supabase の構成で揃い、認証を入れるときも同じ環境のまま進められる。立ち上げ方も `pnpm db:start` の 1 つに揃う。

## 影響

### 得たもの

- 本番と同じ拡張・ロールの上で migration を試せる
- 認証を入れるとき、ローカルの環境を作り直さずに Auth を使える
- CI の `db` ジョブが、手元で開発者が踏む手順と同じ手順を踏む

### 引き受けたコスト

- ローカル開発に Docker が要る
- `supabase start` は Auth・Storage・Studio などのコンテナもまとめて立てる。初回はイメージの取得に時間がかかり、CI の `db` ジョブも素の PostgreSQL より数分遅い
- Supabase CLI が既定で使うポート（54321〜54329）を、ほかのプロジェクトの Supabase と同時には使えない

## 見直しの条件

- CI の `db` ジョブの所要時間が PR の待ち時間の大半を占めるようになったとき。`supabase start -x` で不要なサービスを外すか、CI だけ Postgres のコンテナに切り替えることを検討する
- 認証を Supabase Auth 以外で実装すると決まったとき
