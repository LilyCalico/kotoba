import { MAX_INPUT_LENGTH, type Word } from "@kotoba/shared";
import { describe, expect, it } from "vitest";
import { findWordById, rulesFor } from "./fixtures";
import {
  SHORT_ANSWER_LENGTH,
  lookupVerdict,
  remainingLength,
  resolveInput,
  resolveMeaningInput,
  validateInput,
} from "./input";

function wordOf(id: string): Word {
  const word = findWordById(id);
  if (!word) throw new Error(`${id} が単語プールにない`);
  return word;
}

const fredagsmys = wordOf("fredagsmys");
const mangata = wordOf("mangata");

describe("validateInput", () => {
  it("空の入力を弾く", () => {
    expect(validateInput("")).toBe("empty");
    expect(validateInput("   \n\t ")).toBe("empty");
  });

  it("上限ちょうどまで受け取り、超えたら弾く", () => {
    expect(validateInput("あ".repeat(MAX_INPUT_LENGTH))).toBeNull();
    expect(validateInput("あ".repeat(MAX_INPUT_LENGTH + 1))).toBe("too-long");
  });

  it("前後の空白を落としてから長さを数える", () => {
    expect(validateInput(`  ${"あ".repeat(MAX_INPUT_LENGTH)}  `)).toBeNull();
  });

  it("送信できる入力には理由を返さない", () => {
    expect(validateInput("Is it a noun?")).toBeNull();
  });
});

describe("remainingLength", () => {
  it("入力欄の見た目どおりの長さで数える", () => {
    expect(remainingLength("")).toBe(MAX_INPUT_LENGTH);
    expect(remainingLength("hello")).toBe(MAX_INPUT_LENGTH - 5);
    expect(remainingLength("あ".repeat(MAX_INPUT_LENGTH))).toBe(0);
  });
});

describe("lookupVerdict", () => {
  const rules = rulesFor("fredagsmys");

  it("対応表の 3 値を引く", () => {
    expect(lookupVerdict(rules, "Is it something you do on a Friday?")).toBe("yes");
    expect(lookupVerdict(rules, "Is it something you see in nature?")).toBe("no");
    expect(lookupVerdict(rules, "Is the word expensive to say?")).toBe("irrelevant");
  });

  it("どの行にも当たらない質問は unclear にする", () => {
    expect(lookupVerdict(rules, "Is it from the north?")).toBe("unclear");
  });

  it("対応表を持たない単語ではすべて unclear になる", () => {
    expect(lookupVerdict(rulesFor("fika"), "Is it something you drink?")).toBe("unclear");
  });

  it("語尾の変化を拾う", () => {
    expect(lookupVerdict(rules, "Do you eat snacks?")).toBe("yes");
  });

  it("語の途中に紛れたキーワードは拾わない", () => {
    expect(lookupVerdict(rulesFor("mangata"), "Does it happen during the day?")).toBe("no");
    expect(lookupVerdict(rulesFor("mangata"), "Is it about yesterday?")).toBe("unclear");
  });

  it("先頭の行から順に見て最初に当たった行で確定する", () => {
    expect(
      lookupVerdict(
        [
          { verdict: "no", keywords: ["moon"] },
          { verdict: "yes", keywords: ["moon"] },
        ],
        "Is it about the moon?",
      ),
    ).toBe("no");
  });
});

describe("resolveMeaningInput", () => {
  it("判定基準の正解の例と同じ意味を正解にする", () => {
    const [accept = ""] = fredagsmys.meaning.accepts;

    expect(resolveMeaningInput(fredagsmys, accept)).toEqual({ kind: "answer", correct: true });
  });

  it("単語の綴りと、誤りの例は誤答にする", () => {
    const [reject = ""] = fredagsmys.meaning.rejects;

    expect(resolveMeaningInput(fredagsmys, fredagsmys.word)).toEqual({ kind: "answer", correct: false });
    expect(resolveMeaningInput(fredagsmys, reject)).toEqual({ kind: "answer", correct: false });
  });

  it("質問は単語当てと同じく想定 Q&A で答える", () => {
    expect(resolveMeaningInput(fredagsmys, "Is it about Friday?")).toEqual(
      resolveInput(fredagsmys, "Is it about Friday?"),
    );
  });

  it("問いの形をとらない入力は、長くても誤答にする", () => {
    const text = "金曜日の夜に家族や恋人とソファでお菓子を食べてくつろぐ習慣";

    expect(text.length).toBeGreaterThan(SHORT_ANSWER_LENGTH);
    expect(resolveMeaningInput(fredagsmys, text)).toEqual({ kind: "answer", correct: false });
  });

  it("答えを言葉で説明させる日本語の問いには質問の形を促す", () => {
    expect(resolveMeaningInput(fredagsmys, "どういう意味？")).toEqual({
      kind: "question",
      verdict: "not_a_question",
    });
    expect(resolveMeaningInput(fredagsmys, "何をする時間ですか")).toEqual({
      kind: "question",
      verdict: "not_a_question",
    });
  });

  it("疑問符のない日本語の問いを質問として扱う", () => {
    for (const text of ["食べ物ですか", "家で過ごしますか", "週末のことでしょうか", "金曜日のことかな"]) {
      expect(resolveMeaningInput(fredagsmys, text)).toMatchObject({ kind: "question" });
    }
  });
});

describe("resolveInput", () => {
  it("単語そのものを正解にする", () => {
    expect(resolveInput(fredagsmys, "fredagsmys")).toEqual({ kind: "answer", correct: true });
  });

  it("大文字小文字とダイアクリティカルの揺れを吸収する", () => {
    expect(resolveInput(mangata, "MÅNGATA")).toEqual({ kind: "answer", correct: true });
    expect(resolveInput(mangata, "  mangata  ")).toEqual({ kind: "answer", correct: true });
  });

  it("別の単語の綴りは誤答にする", () => {
    expect(resolveInput(fredagsmys, "fika")).toEqual({ kind: "answer", correct: false });
  });

  it("正解でも result は付けない", () => {
    expect(resolveInput(fredagsmys, "fredagsmys")).not.toHaveProperty("result");
  });

  it("yes / no で答えられる問いには対応表の回答を返す", () => {
    expect(resolveInput(fredagsmys, "Is it something you do on a Friday?")).toEqual({
      kind: "question",
      verdict: "yes",
    });
    expect(resolveInput(fredagsmys, "Is it something you see in nature?")).toEqual({
      kind: "question",
      verdict: "no",
    });
    expect(resolveInput(fredagsmys, "Is the word expensive to say?")).toEqual({
      kind: "question",
      verdict: "irrelevant",
    });
    expect(resolveInput(fredagsmys, "Is it from the north?")).toEqual({
      kind: "question",
      verdict: "unclear",
    });
  });

  it("疑問符がなくても助動詞で始まれば問いとして扱う", () => {
    expect(resolveInput(fredagsmys, "Does it happen on Friday")).toEqual({
      kind: "question",
      verdict: "yes",
    });
  });

  it("yes / no で答えられない問いには質問の形を促す", () => {
    expect(resolveInput(fredagsmys, "What does it mean?")).toEqual({
      kind: "question",
      verdict: "not_a_question",
    });
    expect(resolveInput(fredagsmys, "Tell me the answer please")).toEqual({
      kind: "question",
      verdict: "not_a_question",
    });
  });

  it("問いの形をとらない長い入力は解答にせず質問の形を促す", () => {
    const text = "I think this word has something to do with the weekend";

    expect(text.length).toBeGreaterThan(SHORT_ANSWER_LENGTH);
    expect(resolveInput(fredagsmys, text)).toEqual({
      kind: "question",
      verdict: "not_a_question",
    });
  });

  it("問いの形をとらない短い入力は解答として扱う", () => {
    expect(resolveInput(fredagsmys, "あ".repeat(SHORT_ANSWER_LENGTH))).toEqual({
      kind: "answer",
      correct: false,
    });
    expect(resolveInput(fredagsmys, "あ".repeat(SHORT_ANSWER_LENGTH + 1))).toEqual({
      kind: "question",
      verdict: "not_a_question",
    });
  });

  it("3 語で同じ問いへの回答が割れる", () => {
    const question = "Is it something you do on a Friday?";
    const lagom = wordOf("lagom");

    expect(resolveInput(fredagsmys, question)).toEqual({ kind: "question", verdict: "yes" });
    expect(resolveInput(mangata, question)).toEqual({ kind: "question", verdict: "no" });
    expect(resolveInput(lagom, question)).toEqual({ kind: "question", verdict: "no" });
  });
});
