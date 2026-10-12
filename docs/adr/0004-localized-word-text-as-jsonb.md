# 単語の多言語テキストを jsonb 列で持つ

## ステータス

採用

## コンテキスト

出題する単語は `packages/shared` の `wordSchema` で形が決まっている。項目は 2 種類に分かれる。

| 種類 | 項目 | 使い方 |
| --- | --- | --- |
| 言語によらない値 | `id`・`language`・`word`・`reading`・`partOfSpeech`・`frequency`・`acceptedAnswers` | 出題の絞り込み（`language`）と重み付け（`frequency`）、解答の判定 |
| UI 言語ごとに書き分けるテキスト | `definition`・`teaser`・`hints`（3 つ組）・`literal`・`note`・`example` | 開始・ヒント・結果の応答で、ゲームの `locale` の文をまるごと返す |

UI 言語は `ja` と `en` の 2 つで、どちらかが欠けた単語は `wordSchema` の検証で落ちる。単語は人手で作り、`apps/api/src/words/words.ts` から seed で DB に入れる。語数は数百語の規模を見込む。

UI 言語ごとのテキストを、PostgreSQL のテーブルでどう表すかを決める。

## 決定

言語によらない値は通常の列にし、UI 言語ごとのテキストは `{ ja, en }` の形のまま項目ごとの `jsonb` 列に置く（`apps/api/prisma/schema.prisma` の `Word`）。

| 列 | 型 | 中身 |
| --- | --- | --- |
| `id` | `text`（主キー） | `wordSchema.id` |
| `language` / `part_of_speech` | enum | `languageSchema` / `partOfSpeechSchema` と同じ値 |
| `frequency` | `integer` | 1〜5 |
| `accepted_answers` | `text[]` | 別表記の一覧 |
| `definition` / `teaser` / `literal` / `note` | `jsonb` | `{ ja, en }` |
| `hints` | `jsonb` | `{ ja: [3 つ], en: [3 つ] }` |
| `example` | `jsonb` | `{ sv, translations: { ja, en } }` |

`jsonb` の中身の形は DB では縛らない。書き込み（seed）の前と読み出しの後に `wordSchema` で検証し、形の保証は zod に一本化する。

## 検討した選択肢

### 翻訳テーブルに分ける

`words` と `word_translations`（`word_id` と `locale` ごとに 1 行。`definition`・`teaser`・`hint1`〜`hint3` などの列を持つ）に分ける。

UI 言語を足すときは行を足すだけで済み、`NOT NULL` 制約で訳文の欠けを DB 自身が防げる。

一方で、読み出しのたびに join し、行の集合を `wordSchema` の形（`{ ja, en }`）へ組み直す変換が要る。訳文で検索も並べ替えもせず、常に 1 語分をまるごと読むこの用途では、正規化の利点を使う場面がない。訳文の欠けは seed 時の zod の検証で防げる。

### 言語ごとの列を並べる

`definition_ja`・`definition_en` のように列を並べる。

もっとも単純だが、6 項目 × 言語数の列が並び、`hints` は 3 つ組のため更に増える。UI 言語を足すたびに migration が要る。

### 項目ごとの jsonb 列（採用）

`wordSchema` と形が 1 対 1 に対応し、読み書きに変換が要らない。1 語を 1 行で取り出せる。UI 言語を足すときも列は変わらず、`wordSchema` と単語データの更新だけで済む。

## 影響

### 得たもの

- 単語の形が `wordSchema`・`words.ts`・DB で同じになり、seed と読み出しが値をそのまま受け渡すだけになる
- UI 言語の追加が migration なしで済む

### 引き受けたコスト

- `jsonb` の中身の形を DB が保証しない。DB を直接書き換えると `wordSchema` に合わない行が入り得るため、単語は seed（と将来の管理機能）を通してだけ書く
- Prisma の型では `jsonb` 列が `JsonValue` になる。読み出した値は `wordSchema` で検証してから使う

## 見直しの条件

- 訳文で検索・並べ替えをする機能（単語の一覧画面での検索など）を作るとき
- 単語を人手以外（管理画面・外部からの取り込み）で書き込むようになり、zod を通らない経路ができたとき
