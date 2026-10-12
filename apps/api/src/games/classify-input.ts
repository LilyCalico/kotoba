import { type InputResult, type Word, isAcceptedAnswer } from "@kotoba/shared";

/** 問いの末尾に立つ文字。日本語は疑問符を付けずに「〜ですか」と聞くことが多いため、ひらがなの「か」も含める。 */
const QUESTION_ENDINGS = ["?", "？", "か"];

/** 問いの先頭に立つ英語とスウェーデン語の語。 */
const QUESTION_STARTERS = new Set([
  // 英語の yes / no 疑問文
  "am", "are", "can", "could", "did", "do", "does", "had", "has", "have", "is", "may",
  "might", "must", "shall", "should", "was", "were", "will", "would",
  // 英語の疑問詞
  "how", "what", "when", "where", "which", "who", "whom", "whose", "why",
  // スウェーデン語の疑問詞
  "hur", "vad", "när", "var", "vilken", "vilket", "vilka", "vem", "varför",
]);

function isQuestionShaped(text: string): boolean {
  const trimmed = text.trim();
  if (QUESTION_ENDINGS.some((ending) => trimmed.endsWith(ending))) return true;

  const head = trimmed.toLowerCase().split(/[\s,.:;!?]+/u)[0] ?? "";
  return QUESTION_STARTERS.has(head);
}

/**
 * 入力を簡易ルールで質問と解答に分類する。AI による分類（#28）までの暫定の判定である。
 *
 * - 正規化マッチで正解なら、正解の解答
 * - 疑問符か「か」で終わるか、問いの先頭に立つ語で始まれば質問。回答はまだ判定できないため常に `unclear`
 * - それ以外は誤答
 *
 * 正解でも `result` は付けない。終了カードの中身は呼び出し側がゲームの `locale` で組み立てる。
 */
export function classifyInput(word: Word, text: string): InputResult {
  if (isAcceptedAnswer(word, text)) return { kind: "answer", correct: true };
  if (isQuestionShaped(text)) return { kind: "question", verdict: "unclear" };
  return { kind: "answer", correct: false };
}
