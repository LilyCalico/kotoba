// E2E で Gemini API の代わりに立てるスタブサーバー。
// api の GEMINI_BASE_URL をここへ向け、SDK の呼び出しと応答の検証を含めて本番と同じコードを通す。
// 入力の分類は、プレイヤーの入力だけを見て決まった規則で返す。
//
// - キリル文字かハングルを含む入力: unsupported_language
// - 「?」か「？」で終わる入力: question / yes
// - それ以外: answer
import { createServer } from "node:http";

const PORT = Number(process.env.GEMINI_STUB_PORT ?? 3002);

/** 日本語・英語・スウェーデン語のどれにも使わない文字。 */
const UNSUPPORTED_SCRIPT = /[Ѐ-ӿ가-힯]/u;

function judge(text) {
  if (UNSUPPORTED_SCRIPT.test(text)) return { kind: "unsupported_language", verdict: null };
  if (/[?？]\s*$/u.test(text)) return { kind: "question", verdict: "yes" };
  return { kind: "answer", verdict: null };
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

    const judgement = judge(playerText(JSON.parse(raw || "{}")));
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
