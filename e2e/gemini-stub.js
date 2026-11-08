// E2E で Gemini API の代わりに立てるスタブサーバー。
// api の GEMINI_BASE_URL をここへ向け、SDK の呼び出しと応答の検証を含めて本番と同じコードを通す。
// 入力の分類は、プレイヤーの入力と遊び方を見て決まった規則で返す。
//
// - キリル文字かハングルを含む入力: unsupported_language
// - 意味当てで、システム指示の正解の例（Guesses that capture it）のどれかと一致する入力: answer / 正解
// - 「?」か「？」で終わる入力: question / yes
// - それ以外: answer / 誤答（スペルミス・音写ゆれの救済はしない）
import { createServer } from "node:http";

const PORT = Number(process.env.GEMINI_STUB_PORT ?? 3002);

/** 日本語・英語・スウェーデン語のどれにも使わない文字。 */
const UNSUPPORTED_SCRIPT = /[Ѐ-ӿ가-힯]/u;

/** 意味当てのシステム指示から、正解の例を取り出す。単語当てでは空になる。 */
function meaningAccepts(instruction) {
  const line = instruction.match(/^- Guesses that capture it \(correct\): (.*)$/m);
  return line ? JSON.parse(`[${line[1]}]`) : [];
}

function judge(text, instruction) {
  if (UNSUPPORTED_SCRIPT.test(text)) {
    return { kind: "unsupported_language", verdict: null, correct: null };
  }
  if (meaningAccepts(instruction).includes(text.trim())) {
    return { kind: "answer", verdict: null, correct: true };
  }
  if (/[?？]\s*$/u.test(text)) return { kind: "question", verdict: "yes", correct: null };
  return { kind: "answer", verdict: null, correct: false };
}

/** `generateContent` の本文から、システム指示のテキストを取り出す。 */
function systemText(body) {
  const parts = body.systemInstruction?.parts ?? [];
  return parts.map((part) => part.text ?? "").join("");
}

/** `generateContent` の本文から、プレイヤーの入力（最後の user のテキスト）を取り出す。 */
function playerText(body) {
  const contents = Array.isArray(body.contents) ? body.contents : [];
  const parts = contents.at(-1)?.parts ?? [];
  return parts.map((part) => part.text ?? "").join("");
}

const server = createServer((request, response) => {
  let raw = "";
  request.on("data", (chunk) => {
    raw += chunk;
  });
  request.on("end", () => {
    if (request.method !== "POST" || !request.url?.includes(":generateContent")) {
      response.writeHead(404, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: { code: 404, message: "Not found" } }));
      return;
    }

    const body = JSON.parse(raw || "{}");
    const judgement = judge(playerText(body), systemText(body));
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        candidates: [
          {
            content: { role: "model", parts: [{ text: JSON.stringify(judgement) }] },
            finishReason: "STOP",
          },
        ],
      }),
    );
  });
});

server.listen(PORT, () => {
  console.log(`Gemini stub listening on http://localhost:${PORT}`);
});
