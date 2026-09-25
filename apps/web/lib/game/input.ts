import {
  isAcceptedAnswer,
  MAX_INPUT_LENGTH,
  type Verdict,
  type Word,
} from "@kotoba/shared";

import type { QaRule } from "./fixtures";

export type InputError = "empty" | "too-long";

/** 送信できない入力を弾く。`null` なら送信してよい。 */
export function validateInput(text: string): InputError | null {
  const trimmed = text.trim();
  if (trimmed === "") return "empty";
  if (trimmed.length > MAX_INPUT_LENGTH) return "too-long";
  return null;
}

export function remainingLength(text: string): number {
  return MAX_INPUT_LENGTH - text.length;
}

const QUESTION_STARTERS = [
  "am",
  "are",
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
  "should",
  "was",
  "were",
  "will",
  "would",
];

/** これより長い平叙文は、解答ではなく形を外した質問として扱う。 */
const ANSWER_MAX_LENGTH = 20;

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function isQuestion(text: string): boolean {
  const trimmed = text.trim();
  if (/[?？]$/.test(trimmed)) return true;

  const [first] = fold(trimmed).split(/\s+/);
  return QUESTION_STARTERS.includes(first);
}

export function lookupVerdict(rules: QaRule[], text: string): Verdict {
  const folded = fold(text);
  const matched = rules.find((rule) =>
    rule.keywords.some((keyword) => folded.includes(keyword)),
  );

  return matched?.verdict ?? "unclear";
}

export type ResolvedInput =
  | { kind: "question"; verdict: Verdict }
  | { kind: "answer"; correct: boolean };

/**
 * 入力を 4 段階で切り分ける。
 * 正解にあたる文字列が最優先で、質問の形をとらない長文だけが `not_a_question` に落ちる。
 */
export function resolveInput(
  word: Word,
  rules: QaRule[],
  text: string,
): ResolvedInput {
  const trimmed = text.trim();

  if (isAcceptedAnswer(word, trimmed)) {
    return { kind: "answer", correct: true };
  }
  if (isQuestion(trimmed)) {
    return { kind: "question", verdict: lookupVerdict(rules, trimmed) };
  }
  if (trimmed.length <= ANSWER_MAX_LENGTH) {
    return { kind: "answer", correct: false };
  }
  return { kind: "question", verdict: "not_a_question" };
}
