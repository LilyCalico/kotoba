## 概要

ゲーム 1 周を担う `apps/api` のゲームセッション API を定める。`apps/web` はこの API だけを通してゲームを進め、単語データを持たない。

## 前提

| 項目 | 内容 |
| --- | --- |
| 形式 | REST。リクエストとレスポンスの本文は JSON |
| 接頭辞 | `/api/v1`。公開ルーティングで `/api/v1/(.*)` が api サービスに届き、api は `setGlobalPrefix("api/v1")` で受ける |
| 呼び出し元 | 同一ホストの `apps/web` だけ。フロントは相対パス `/api/v1` を叩くため CORS を設定しない |
| 認証 | なし。推測できない `gameId`（UUID v4）を知っていることが、そのゲームを操作できる条件になる |
| 型 | リクエストとレスポンスの形は `packages/shared` の zod スキーマで定め、api の検証と web の型の両方に使う。OpenAPI 仕様はこのスキーマから生成する |
| キャッシュ | すべての応答に `Cache-Control: no-store` を付ける |

## エンドポイント

進行中ゲームをリソースとし、`apps/web` の `GameClient`（`lib/game/client.ts`）の 4 メソッドと 1 対 1 に対応させる。

| 操作 | メソッド / パス | `GameClient` | 成功時 |
| --- | --- | --- | --- |
| ゲーム開始 | `POST /api/v1/games` | `startGame` | 201 `GameStart` |
| 入力 | `POST /api/v1/games/{gameId}/inputs` | `sendInput` | 200 `InputResult` |
| ヒント開示 | `POST /api/v1/games/{gameId}/hints` | `revealHint` | 200 `Hint` |
| ギブアップ | `POST /api/v1/games/{gameId}/give-up` | `giveUp` | 200 `GameResult` |

`gameId` はパスで受ける。形式が UUID でない `gameId` は `validation_error`、UUID として正しいが該当するゲームがない場合は `game_not_found` とする。

### ゲーム開始 `POST /api/v1/games`

単語プールから 1 語を選び、新しいゲームを始める。

リクエスト本文:

| フィールド | 型 | 必須 | 内容 |
| --- | --- | --- | --- |
| `language` | `"sv"` | ○ | 出題言語。単語プールを持つ言語だけを受け付け、`languageSchema` にあってもプールのない言語（`ja`）は `validation_error` にする |
| `locale` | `"ja"` \| `"en"` | | 設問・ヒント・定義を返す言語。省略時は `"en"`。ゲームの間は変わらない |
| `excludeWordIds` | `string[]` | | 出題から除く単語の id。クライアントがローカルストレージに記録した、答えを見た単語。最大 100 件。プールにない id は無視する |

```json
{ "language": "sv", "locale": "en", "excludeWordIds": ["fredagsmys"] }
```

選び方:

- 対象言語の単語プールから `excludeWordIds` を除き、`frequency` を重みとしてランダムに 1 語選ぶ
- 除いた結果が空なら、プール全体から選ぶ
- クライアントは、終了時に届いた `GameResult` の `wordId` が記録に既にあれば、記録をその 1 件だけに戻す。プールを一巡したことをサーバーに問い合わせずに知り、次の一巡の重複除外をやり直せる

レスポンス（201）: `GameStart`

```json
{ "gameId": "4f0e…", "language": "sv", "teaser": "On Friday night, this word lives on the sofa" }
```

### 入力 `POST /api/v1/games/{gameId}/inputs`

プレイヤーの入力を質問と解答に分類し、質問には回答を、解答には正誤を返す。

リクエスト本文:

| フィールド | 型 | 必須 | 内容 |
| --- | --- | --- | --- |
| `text` | `string` | ○ | 入力。前後の空白を除いて 1〜200 字（`MAX_INPUT_LENGTH`） |

レスポンス（200）: `InputResult`。`kind` で 3 種に分かれる。

| `kind` | 形 | 起きるとき |
| --- | --- | --- |
| `question` | `{ kind, verdict }` | 質問と分類した。`verdict` は `yes` / `no` / `unclear` / `irrelevant` / `not_a_question` の 5 値だけ |
| `answer` | `{ kind, correct, result? }` | 解答と分類した。正解なら `correct: true` と `result`（`GameResult`）を含み、ゲームは終わる |
| `unsupported_language` | `{ kind }` | 日本語・英語・スウェーデン語以外の入力。画面は「対応言語で質問してね」を出す |

```json
{ "kind": "question", "verdict": "yes" }
{ "kind": "answer", "correct": false }
{ "kind": "answer", "correct": true, "result": { "outcome": "cleared", "wordId": "fredagsmys", "word": "Fredagsmys", "definition": "…" } }
{ "kind": "unsupported_language" }
```

- `unsupported_language` を 5 値の `verdict` に足さないのは、`verdict` が AI の出力を縛る enum だからである。対応言語の判定は分類の段で行い、回答の enum を広げない
- 入力はすべて Q&A 履歴としてセッションに積む。履歴は AI の判定の一貫性のためにサーバーだけが使い、どの応答にも含めない
- 入力は冪等でない。通信の失敗でクライアントが再送すると、同じ入力が履歴に 2 回積まれることがある。回答の一貫性には影響しないため許容する

### ヒント開示 `POST /api/v1/games/{gameId}/hints`

`index` 番目のヒントを返す。

リクエスト本文:

| フィールド | 型 | 必須 | 内容 |
| --- | --- | --- | --- |
| `index` | `integer` | ○ | 1 始まりのヒント番号 |

振る舞い（開示済みの数を `n` とする）:

| `index` | 応答 |
| --- | --- |
| `n + 1`（1〜3） | 200。ヒントを開示し、開示済みの数を進める |
| `n` 以下 | 200。開示済みのヒントを同じ内容で返し、数は進めない |
| `n + 2` 以上（3 以下） | 409 `hint_out_of_order` |
| 4 以上 | 409 `hint_limit_reached` |

番号をクライアントに送らせるのは、再送を冪等にするためである。サーバーだけが数えると、応答が届かずクライアントが再送したとき次のヒントが開示され、プレイヤーは 1 つ読み飛ばす。

レスポンス（200）: `Hint`

```json
{ "index": 1, "text": "The word is tied to one particular day of the week" }
```

### ギブアップ `POST /api/v1/games/{gameId}/give-up`

ギブアップを確定し、正解を返す。リクエスト本文はない。

レスポンス（200）: `GameResult`（`outcome: "gave_up"`）

```json
{ "outcome": "gave_up", "wordId": "fredagsmys", "word": "Fredagsmys", "definition": "…" }
```

- ギブアップ済みのゲームにもう一度送った場合は、同じ `GameResult` を 200 で返す（再送を冪等にする）
- クリア済みのゲームには `game_finished` を返す

## 共有スキーマ

リクエストとレスポンスの型は `packages/shared/src/game.ts` の zod スキーマで表す。

| スキーマ | 形 | 使う場所 |
| --- | --- | --- |
| `startGameRequestSchema` | `{ language, locale?, excludeWordIds? }`。`locale` は `uiLocaleSchema`（既定 `en`） | 開始のリクエスト |
| `gameStartSchema` | `{ gameId, language, teaser }` | 開始のレスポンス |
| `playerInputSchema` | `{ text }` | 入力のリクエスト |
| `inputResultSchema` | `questionResultSchema` / `answerResultSchema` / `unsupportedLanguageResultSchema` の判別共用体（`kind`） | 入力のレスポンス |
| `hintRequestSchema` | `{ index }`（1 以上の整数） | ヒントのリクエスト |
| `hintSchema` | `{ index, text }` | ヒントのレスポンス |
| `gameResultSchema` | `{ outcome, wordId, word, definition }` | 正解時の `result` とギブアップのレスポンス |
| `problemSchema` | `{ type, title, status, code, detail? }` | エラーのレスポンス |

`gameId` はパスで受けるため、リクエスト本文のスキーマには含めない。

`gameResultSchema` が `wordId` を持つのは、クライアントが出題済みの単語を記録するためである。`GameStart` は単語の id を返さず（id は多くの場合単語そのものなので答えが漏れる）、終了後に届く `GameResult` が id を知る唯一の機会になる。

## 秘密の情報

ゲームが終わる（クリアかギブアップ）まで、どの応答にも次を含めない。

- 単語そのもの（`word`）・単語の id（`wordId`）・読み・定義
- 開示していないヒント
- Q&A 履歴と、AI に渡したプロンプト

エラーの本文（`detail`）にもこれらを書かない。

## エラー

失敗は RFC 9457 の Problem Details（`Content-Type: application/problem+json`）で返し、機械的に扱うための `code` を足す。`type` は `about:blank` とし、`title` には HTTP ステータスの理由句を入れる。

```json
{
  "type": "about:blank",
  "title": "Not Found",
  "status": 404,
  "code": "game_not_found",
  "detail": "The game does not exist or has expired."
}
```

| `code` | HTTP | 起きるとき | 画面の扱い |
| --- | --- | --- | --- |
| `validation_error` | 400 | 本文やパスがスキーマに合わない（空の入力・201 字以上・UUID でない `gameId` など） | 「もう一度送ってね」 |
| `game_not_found` | 404 | 該当するゲームがない、または期限切れ | ゲームを始め直す案内 |
| `game_finished` | 409 | 終了したゲームへの入力・ヒント、クリア済みのゲームへのギブアップ | 何もしない（画面側で操作を塞いでいるため通常は起きない） |
| `hint_out_of_order` | 409 | 開示済みの次でも既開示でもないヒント番号 | 「もう一度送ってね」 |
| `hint_limit_reached` | 409 | 4 以上のヒント番号 | 何もしない（ボタンは 0 で押せない） |
| `rate_limited` | 429 | 入力のレートリミット超過。`Retry-After` ヘッダーで待つ秒数を返す | 「少し待ってからもう一度送ってね」 |
| `ai_unavailable` | 503 | AI の呼び出しがサーバー内の 1 回の自動リトライ後も失敗した | 「もう一度送ってね」 |

- 画面は `code` で分岐し、`title` と `detail` を表示に使わない。表示文言は UI 言語に合わせて画面側が持つ
- `GameClient` の fetch 実装は、失敗をすべて `GameClientError` に変換し、`code` を持たせる

## 進行中ゲームの保持

| 項目 | 内容 |
| --- | --- |
| 保持する内容 | 単語の id・`locale`・開示済みヒントの数・Q&A 履歴・終了状態と結果 |
| 保持の口 | `GameStore` インターフェース。API のほかのコードは保存先を知らない |
| 期限 | 最後の操作から 1 時間で破棄し、以降は `game_not_found` を返す |
| 保存先 | `GameStore` の実装が決める。Vercel では関数のインスタンスが複数立つため、デプロイした環境では複数のインスタンスで共有できる保存先を使う |

保存先の選び方は `docs/adr/0003-game-session-store.md` に従う。

## レートリミット

入力（`POST /api/v1/games/{gameId}/inputs`）は AI の呼び出しにつながるため、レートリミットの対象にする。超過時は `rate_limited` と `Retry-After` を返す。開始・ヒント・ギブアップは AI を呼ばないため対象にしない。

制限値と数える単位は、通常のプレイ（続けて質問を打つ）を妨げず、スクリプトによる連打を抑える値として実装側で決め、根拠をその設定のコメントに残す。
