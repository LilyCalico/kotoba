# Gemini による入力の判定の手順

`apps/api` がプレイヤーの入力を Gemini で分類し、質問に 5 値で答えるまでの手順。判定の流れと設計の理由は [ADR 0008](../adr/0008-input-judging-with-gemini-structured-output.md) を参照する。

## このリポジトリでの前提

| 項目 | 値 | 理由 |
| --- | --- | --- |
| SDK | `@google/genai` | Gemini API の公式 SDK。structured output（`responseJsonSchema`）と接続先の差し替え（`httpOptions.baseUrl`）を持つ |
| 設定の読み込み | `@nestjs/config` の `ConfigService` | 環境変数は Node.js の `--env-file-if-exists` で読み込み済み。`ConfigModule` は `ignoreEnvFile: true` で `process.env` だけを見る |
| モデル | `gemini-3.5-flash-lite` | 分類と 5 値の回答には Flash-Lite で足りる |
| 判定の口 | `InputJudge` インターフェース（`apps/api/src/judge/`） | `GamesService` は Gemini を知らない。テストでは差し替える |

## 1. 依存を入れる

```bash
pnpm --filter @kotoba/api add @google/genai @nestjs/config
```

## 2. API キーを用意する

[Google AI Studio](https://aistudio.google.com/apikey) でキーを発行し、`apps/api/.env` に書く。

```bash
# apps/api/.env
GEMINI_API_KEY="<発行したキー>"
```

| 環境変数 | 既定 | 内容 |
| --- | --- | --- |
| `GEMINI_API_KEY` | なし | 未設定でも api は起動する。起動時に警告を出し、AI が要る入力は `ai_unavailable` を返す |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` | 使うモデル |
| `GEMINI_BASE_URL` | なし（Gemini API） | E2E でスタブサーバーへ向けるときだけ指定する |

キーはリポジトリに含めない。Vercel ではプロジェクトの環境変数に置く。

## 3. 判定の口を組み立てる

`JudgeModule` が環境変数から `InputJudge` を作り、`GamesModule` に渡す。

```typescript
// apps/api/src/judge/judge.module.ts
export function createInputJudge(config: ConfigService): InputJudge {
  const apiKey = config.get<string>("GEMINI_API_KEY");
  if (!apiKey) {
    new Logger("JudgeModule").warn("GEMINI_API_KEY が未設定のため、AI が要る入力は ai_unavailable を返す");
    return new UnavailableInputJudge();
  }

  const generate = createGenerateContent({ apiKey, baseUrl: config.get<string>("GEMINI_BASE_URL") });
  return new GeminiInputJudge(generate, {
    model: config.get<string>("GEMINI_MODEL") || DEFAULT_GEMINI_MODEL,
  });
}
```

| 部品 | 置き場所 | 役割 |
| --- | --- | --- |
| `buildJudgePrompt` | `judge-prompt.ts` | 分類の規則・秘密の単語・全 Q&A 履歴をシステム指示に、プレイヤーの入力を本文に置く |
| `GeminiInputJudge` | `gemini-input-judge.ts` | structured output で `{ kind, verdict }` を返させ、zod で検証する。失敗は 1 回だけ再試行する |
| `createGenerateContent` | `gemini-input-judge.ts` | `GoogleGenAI` を作り、`models.generateContent` を返す。SDK の自動リトライは `retryOptions: { attempts: 1 }` で切る |
| `UnavailableInputJudge` | `gemini-input-judge.ts` | キーがないときに差し込み、常に `ai_unavailable` を投げる |

## 4. structured output のスキーマを渡す

返させる形は zod で書き、`z.toJSONSchema` で JSON Schema にして `responseJsonSchema` に渡す。応答も同じ zod スキーマで検証する。

```typescript
const judgementResponseSchema = z.object({
  kind: z.enum(["question", "answer", "unsupported_language"]),
  verdict: verdictSchema.nullable(),
});

const { $schema: _schema, ...RESPONSE_JSON_SCHEMA } = z.toJSONSchema(judgementResponseSchema);
```

`z.toJSONSchema` が付ける `$schema` は、Gemini の `responseJsonSchema` が受け付けるキーワードの一覧にないため取り除く。`responseJsonSchema` は `responseMimeType: "application/json"` と組で指定する。

## 5. E2E ではスタブサーバーに向ける

`e2e/gemini-stub.js` が Gemini API の `generateContent` の代わりに応答する。Playwright の `webServer` でスタブを立て、api の `GEMINI_BASE_URL` をそこへ向ける。

```typescript
// e2e/playwright.config.ts
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
  // ...
},
```

| 入力 | スタブの応答 |
| --- | --- |
| キリル文字かハングルを含む | `unsupported_language` |
| 「?」か「？」で終わる | `question` / `yes` |
| それ以外 | `answer` |

キーはスタブが見ないため、空でなければ何でもよい。CI に Gemini のキーは要らない。

## つまずきポイント

### 質問や誤答を送ると「Something went wrong.」が出る

**症状**: ゲームは始まり、正解とヒント・ギブアップは動くが、質問や正解でない入力を送るたびに再送の案内が出る。正規化マッチで正解しなかった入力はすべて AI に回るためである。

**原因**: api が `ai_unavailable` を返している。

| 状況 | api のログ |
| --- | --- |
| `GEMINI_API_KEY` が未設定 | 起動時に `GEMINI_API_KEY が未設定のため…` の警告 |
| キーが誤っている・モデル名が誤っている・Gemini の障害 | 入力ごとに `Gemini の判定に失敗した（1/2 回目）` と `（2/2 回目）` の警告 |

**対処**: `apps/api/.env` の `GEMINI_API_KEY` と `GEMINI_MODEL` を確かめ、api を再起動する。
