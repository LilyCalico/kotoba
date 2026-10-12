<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# プロジェクト概要

## セッション開始時の手順

- Issue ベースの作業時は worktree を作成する
- 命名は feat/{issue 番号}-{kebab-case 英語 max3 語} 形式にする

## 文章・コメントの記述規約

このリポジトリで生成するすべての文章（ドキュメント・PR 本文・コミットメッセージ）とコード内コメントに適用する。

- 最終的な設計を「最初からそう計画したもの」として記述する。検討過程や試行錯誤の痕跡を残さない。
- 読者は経緯を一切知らない新規参加者を想定する。経緯を知らないと意味が通じない文（「先ほどの」「元の実装では」「修正により」など）は書かない。
- 既存の記述を更新する場合も、差分の説明ではなく、更新後の状態が完結した説明になるよう全体を書き直す。

## 技術スタック

| 領域                   | 技術                                                                     |
| ---------------------- | ------------------------------------------------------------------------ |
| フロントエンド         | Next.js（App Router）/ TypeScript                                        |
| UI コンポーネント      | shadcn/ui（primitive base: React Aria Components）+ 自作デザイントークン |
| アニメーション         | Motion（旧 Framer Motion）                                               |
| バックエンド           | NestJS（REST API）/ TypeScript                                           |
| モノレポ管理           | pnpm + Turborepo                                                         |
| DB                     | PostgreSQL（Supabase）+ Prisma                                           |
| AI                     | Gemini API（はい/いいえ応答・解答判定: Flash 系の安価モデル）            |
| バリデーション・型共有 | zod（`packages/shared` でフロント・API 間共有）                          |
| テスト                 | Vitest（ユニット）/ Storybook（コンポーネント）/ Playwright（E2E）       |
| CI/CD                  | GitHub Actions                                                           |
| 依存関係更新           | Renovate                                                                 |
| ホスティング           | Vercel（web + api を Services で 1 プロジェクト）/ DB+Auth: Supabase      |

## 構成

- モノレポ構成:
  - `apps/web` — Next.js（App Router）
  - `apps/api` — NestJS（REST）
  - `packages/shared` — 型・zod スキーマ共有
- NestJS から OpenAPI 仕様を自動生成 → フロントの型付きクライアントを生成
- デプロイは Vercel Services で `apps/web` と `apps/api` を 1 プロジェクトの 2 サービスとして扱う。web と api が同一 deployment としてシップされるため、プレビュー環境でフロントとバックが常に同期し、ロールバックも一括で効く
  - 公開ルーティングは `/api/v1/(.*)` を api に、それ以外のすべてを web に向ける。Next.js 自身の `/api` と名前空間が衝突しないよう、api には専用のサブ名前空間を割り当てる
  - サービスにはオリジナルのリクエストパスがそのまま届くため、api 側は `setGlobalPrefix("api/v1")` で接頭辞を受ける
  - web と api が同一ホストに載るので、フロントからは相対パス `/api/v1` を叩く。プレビューは 1 デプロイ 1 ホストであり、相対パスなら常に自分のデプロイの api を呼ぶ

## ドキュメントの構成

`docs/` は役割ごとに 4 つに分ける。

| ディレクトリ | 扱うもの |
| --- | --- |
| `docs/specifications/` | 何を作るか。プロダクト仕様 |
| `docs/adr/` | なぜそう決めたか。書き方は `docs/adr/README.md` に従う |
| `docs/guides/` | どう設定するか。採用した構成の再現手順 |
| `docs/notes/` | どう書くか。初めて使うライブラリの使い方を、このリポジトリの実装を例に解説する学習用ノート |

構成や技術選定のうち、選択肢が複数あり後から意図を問われるものは ADR として残す。

## コンポーネント実装規約

UI を実装・変更するときは、デザインの詳細（トーン&マナー・デザイントークン・アニメーション方針）を `docs/specifications/design.md` に従って決める。

## API 実装規約

`apps/api` のエンドポイントと、それを呼ぶ `apps/web` のクライアントを実装・変更するときは、パス・リクエスト・レスポンス・エラーを `docs/specifications/api.md` に従って決める。仕様を変えるときは、先に `api.md` を更新する。
