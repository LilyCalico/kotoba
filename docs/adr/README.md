# Architecture Decision Records

構成や技術選定のうち、後から「なぜこうなっているのか」を問われるものを 1 決定 1 ファイルで記録する。

## 書く対象

- 選択肢が複数あり、どれを選んでも動くもの（タスクランナー、ホスティング先、状態管理の方針など）
- 一度決めると引き剥がすコストが高いもの
- 実装を読んでも意図が復元できないもの

自明な選定や、実装を読めば分かることは書かない。

## ファイル名

`NNNN-kebab-case-english-title.md`。連番は 0001 から、決定した順に振る。番号は再利用しない。

## 構成

各 ADR は次の見出しを持つ。

| 見出し | 内容 |
| --- | --- |
| ステータス | 採用 / 却下 / 廃止 / 置き換え（置き換えの場合は後継 ADR 番号を書く） |
| コンテキスト | その決定が必要になった状況。制約と、満たすべき要件 |
| 決定 | 何を選んだか。設定の要点を含む |
| 検討した選択肢 | 却下したものを含む全選択肢と、その評価 |
| 影響 | 決定によって得たものと、引き受けたコスト |
| 見直しの条件 | どうなったら再検討するか |

決定が覆った場合、元の ADR は書き換えず、ステータスを「置き換え」に変更して新しい ADR を追加する。

## 一覧

| # | タイトル | ステータス |
| --- | --- | --- |
| [0001](0001-turborepo-as-task-runner.md) | Turborepo をタスクランナーとして採用する | 採用 |
| [0002](0002-vitest-and-playwright-for-testing.md) | テストを Vitest と Playwright で構成する | 採用 |
| [0003](0003-game-session-store.md) | 進行中ゲームを GameStore の裏で保持し、デプロイ前に共有ストアへ差し替える | 採用 |
| [0004](0004-localized-word-text-as-jsonb.md) | 単語の多言語テキストを jsonb 列で持つ | 採用 |
| [0005](0005-supabase-cli-for-local-and-ci-db.md) | ローカル開発と CI の DB を Supabase CLI で立てる | 採用 |
| [0006](0006-openapi-from-zod-via-nestjs-swagger.md) | OpenAPI 仕様を @nestjs/swagger と zod の Standard Schema から生成する | 採用 |
| [0007](0007-game-store-on-postgresql.md) | 進行中ゲームを Supabase の PostgreSQL に保持する | 採用 |
| [0008](0008-input-judging-with-gemini-structured-output.md) | 入力の分類と質問への回答を Gemini の structured output で行う | 採用 |
| [0009](0009-answer-typo-rescue-in-the-judging-call.md) | 解答のスペルミス・音写ゆれの救済を、入力の分類と同じ Gemini の呼び出しで判定する | 採用 |
| [0010](0010-ai-eval-with-own-runner.md) | AI の判定の eval を、判定の実装を直接呼ぶ自前のランナーで流す | 採用 |
| [0011](0011-ui-locale-in-url-with-own-dictionaries.md) | UI 言語を URL のサブパスで分け、文言はライブラリを使わず型付きの辞書で持つ | 採用 |
