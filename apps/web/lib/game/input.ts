import {
  type InputResult,
  MAX_INPUT_LENGTH,
  type Verdict,
  type Word,
  isAcceptedAnswer,
  matchesNormalized,
} from "@kotoba/shared";

import { type QaRule, rulesFor } from "./fixtures";

/** 送信を止める理由。 */
export type InputError = "empty" | "too-long";

/**
 * 単語当てで、疑問文の形をとらない入力のうち、ここまでの長さを解答とみなす。
 * 意味当ての解答は文で書くため、入力できる長さ（`MAX_INPUT_LENGTH`）まで解答とみなす。
 */
export const SHORT_ANSWER_LENGTH = 20;

/**
 * 送信してよい入力かを調べる。`null` なら送信できる。
 * 長さは `playerInputSchema` と揃えて `trim` 後で数える。
 */
export function validateInput(text: string): InputError | null {
  const trimmed = text.trim();

  if (trimmed === "") return "empty";
  if (trimmed.length > MAX_INPUT_LENGTH) return "too-long";
  return null;
}

/**
 * 入力欄に添える残り文字数。
 * 入力欄の見た目と合わせるため、`trim` せずそのままの長さで数える。
 */
export function remainingLength(text: string): number {
  return MAX_INPUT_LENGTH - text.length;
}

/** yes / no で答えられる問いの先頭に立つ語。 */
const YES_NO_STARTERS = [
  "am",
  "are",
  "be",
  "been",
  "can",
  "could",
  "did",
  "do",
  "does",
  "had",
  "has",
  "have",
  "is",
  "may",
  "might",
  "must",
  "shall",
  "should",
  "was",
  "were",
  "will",
  "would",
];

/** 答えを言葉で説明させる問いの先頭に立つ語。yes / no では答えられない。 */
const OPEN_STARTERS = ["how", "what", "when", "where", "which", "who", "whom", "whose", "why"];

/**
 * 答えを言葉で説明させる日本語の問いに含まれる語。日本語では疑問詞が文頭に立たないため、文のどこにあっても見る。
 * 「何か」のように yes / no の問いにも現れる形は含めない。
 */
const JA_OPEN_WORDS = ["どういう", "どんな", "どうして", "なぜ", "何を", "何が", "何の", "誰"];

const QUESTION_MARKS = ["?", "？"];

/** 疑問符を付けない日本語の問いの文末。「食べ物ですか」「金曜日のことかな」。 */
const JA_QUESTION_ENDINGS = ["ですか", "ますか", "でしょうか", "かな"];

function firstWord(text: string): string {
  return text.trim().toLowerCase().split(/[\s,.:;!?]+/u)[0] ?? "";
}

function endsLikeQuestion(text: string): boolean {
  const trimmed = text.trim();
  return [...QUESTION_MARKS, ...JA_QUESTION_ENDINGS].some((ending) => trimmed.endsWith(ending));
}

/** 問いの形をとっているか。yes / no で答えられるかは問わない。 */
function isQuestionShaped(text: string): boolean {
  const head = firstWord(text);
  return (
    endsLikeQuestion(text) ||
    YES_NO_STARTERS.includes(head) ||
    OPEN_STARTERS.includes(head)
  );
}

/** yes / no で答えられる問いの形をとっているか。 */
function isYesNoQuestion(text: string): boolean {
  if (OPEN_STARTERS.includes(firstWord(text))) return false;
  if (JA_OPEN_WORDS.some((word) => text.includes(word))) return false;
  return endsLikeQuestion(text) || YES_NO_STARTERS.includes(firstWord(text));
}

/**
 * `needle` が語の先頭として現れるかを調べる。
 * 語尾の変化を拾うため後方は見ない。`snack` は `snacks` に当たり、`day` は `yesterday` に当たらない。
 */
function hasWordStartingWith(haystack: string, needle: string): boolean {
  for (let from = 0; from <= haystack.length - needle.length; ) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) return false;
    if (at === 0 || !/[a-z0-9]/u.test(haystack[at - 1] ?? "")) return true;
    from = at + 1;
  }
  return false;
}

/**
 * 想定 Q&A を引いて質問への回答を決める。
 * 先頭の行から順に見て、最初に当たった行で確定する。どの行にも当たらなければ `unclear`。
 */
export function lookupVerdict(rules: readonly QaRule[], text: string): Verdict {
  const haystack = text.toLowerCase();

  for (const rule of rules) {
    if (rule.keywords.some((keyword) => hasWordStartingWith(haystack, keyword))) {
      return rule.verdict;
    }
  }
  return "unclear";
}

/**
 * 単語当ての入力を質問と解答に分類し、質問には 5 値の回答を、解答には正誤を返す。
 * 実の API では AI が担う判断を、想定 Q&A と入力の形から代行する。
 *
 * 正解でも `result` は付けない。終了カードに載せる単語と定義は UI 言語で変わるため、
 * 呼び出し側が組み立てる。
 */
export function resolveInput(word: Word, text: string): InputResult {
  if (isAcceptedAnswer(word, text)) {
    return { kind: "answer", correct: true };
  }
  return resolveByShape(word, text, SHORT_ANSWER_LENGTH);
}

/**
 * 意味当ての入力を分類する。判定基準の正解の例（`meaning.accepts`）と同じ入力を正解にし、
 * それ以外は単語当てと同じく入力の形で分ける。問いの形をとらない入力は、長さによらず解答とみなす。
 * 言い換えを核心で判定する AI の代わりはしない。
 */
export function resolveMeaningInput(word: Word, text: string): InputResult {
  if (matchesNormalized(word.meaning.accepts, text)) {
    return { kind: "answer", correct: true };
  }
  return resolveByShape(word, text, MAX_INPUT_LENGTH);
}

/**
 * 正解でなかった入力を、形から質問・誤答・質問になっていない入力に分ける。
 * 問いの形をとらない入力は、`maxAnswerLength` 文字までを誤答、それより長ければ質問になっていない入力とする。
 */
function resolveByShape(word: Word, text: string, maxAnswerLength: number): InputResult {
  if (isYesNoQuestion(text)) {
    return { kind: "question", verdict: lookupVerdict(rulesFor(word.id), text) };
  }
  if (!isQuestionShaped(text) && text.trim().length <= maxAnswerLength) {
    return { kind: "answer", correct: false };
  }
  return { kind: "question", verdict: "not_a_question" };
}
