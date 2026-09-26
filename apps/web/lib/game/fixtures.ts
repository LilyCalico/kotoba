import { type Verdict, type Word, wordSchema } from "@kotoba/shared";

/**
 * 想定 Q&A の 1 行。質問文がキーワードのいずれかを含んだとき、この `verdict` を返す。
 *
 * 単語ごとに配列で持ち、先頭から順に見て最初に当たった行で確定する。順序が優先順位を表す。
 * どの行にも当たらない質問には `unclear` を返すため、対応表は 3 値だけを扱う。
 * `not_a_question` は質問と解答の分類で決まるので、ここには現れない。
 */
export type QaRule = {
  verdict: Extract<Verdict, "yes" | "no" | "irrelevant">;
  /** 小文字で書く。同じ単語の別の行のキーワードと部分文字列として重ならないようにする。 */
  keywords: string[];
};

/** 単語の正体ではなく出題そのものを問う、どの単語でも成立しないメタな問い。 */
const META_QUESTIONS = [
  "price",
  "expensive",
  "cheap",
  "spell",
  "letters",
  "famous",
  "google",
  "answer",
  "cheat",
  "give up",
];

const source: Word[] = [
  {
    id: "fredagsmys",
    language: "sv",
    word: "Fredagsmys",
    reading: "フレーダグスミュース",
    partOfSpeech: "noun",
    frequency: 4,
    acceptedAnswers: ["fredagsmys", "フレーダグスミュース"],
    definition: {
      ja: "金曜の夜に家族や恋人とソファでスナックを囲み、まったり過ごす習慣。",
      en: "The habit of settling onto the sofa with family or a partner on a Friday night, snacks at hand.",
    },
    literal: { ja: "金曜のくつろぎ", en: "Friday coziness" },
    teaser: {
      ja: "金曜日の夜、この言葉はソファの上にある",
      en: "On Friday night, this word lives on the sofa",
    },
    hints: {
      ja: [
        "一週間のうち、特定の曜日とだけ結びついた言葉です",
        "家族や恋人とスナックを買い込み、出かけずに家で過ごす夜のことです",
        "曜日の名前と「くつろぎ」を意味する語をつなげた合成語です",
      ],
      en: [
        "The word is tied to one particular day of the week",
        "It means staying in with family or a partner, with snacks bought for the occasion",
        "It is a compound of the name of a day and a word meaning coziness",
      ],
    },
    example: {
      sv: "Vad ska vi ha till fredagsmyset?",
      translations: {
        ja: "今夜のフレーダグスミュース、何にする？",
        en: "What are we having for tonight's cozy night in?",
      },
    },
  },
  {
    id: "mangata",
    language: "sv",
    word: "Mångata",
    reading: "モーンガータ",
    partOfSpeech: "noun",
    frequency: 1,
    acceptedAnswers: ["mångata", "モーンガータ"],
    definition: {
      ja: "月の光が水面に映ってできる、道のように伸びた光の帯。",
      en: "The road-like band of light the moon lays across water.",
    },
    literal: { ja: "月の道", en: "moon road" },
    teaser: {
      ja: "夜、水の上にだけ現れて、誰も歩けない道がある",
      en: "At night a road appears on the water, and no one can walk it",
    },
    hints: {
      ja: [
        "自然の中に現れる光景を指す名詞です",
        "夜に湖や海のそばにいると見えるもので、天気と月の満ち欠けに左右されます",
        "空に浮かぶものの名前と、「道」を意味する語をつなげた合成語です",
      ],
      en: [
        "A noun for a sight that appears out in nature",
        "You see it beside a lake or the sea at night, and the weather and the phase of the moon decide whether it is there",
        "It is a compound of something in the sky and the word for a road",
      ],
    },
  },
  {
    id: "lagom",
    language: "sv",
    word: "Lagom",
    reading: "ラーゴム",
    partOfSpeech: "adjective",
    frequency: 4,
    acceptedAnswers: ["lagom", "ラーゴム"],
    definition: {
      ja: "多すぎず少なすぎず、ちょうどいい状態。",
      en: "Just the right amount — neither too much nor too little.",
    },
    note: {
      ja: "過不足のなさを良しとするスウェーデンの価値観を象徴する語で、褒め言葉として使われる。",
      en: "It stands for a national preference for moderation, and works as a compliment.",
    },
    teaser: {
      ja: "足りなくもなく、余ってもいない。その状態そのものに名前がある",
      en: "Nothing is missing, and nothing is left over. That state itself has a name",
    },
    hints: {
      ja: [
        "量や程度について述べる言葉で、褒め言葉としても使われます",
        "音量、湯加減、料理の盛りつけ — 過不足がないと感じたあらゆる場面で使えます",
        "控えめであることを良しとする、この国の価値観そのものを表すとされています",
      ],
      en: [
        "It describes quantity or degree, and people use it as praise",
        "Volume, water temperature, the size of a portion — anything that feels neither excessive nor lacking",
        "It is said to capture this country's own value of never overdoing anything",
      ],
    },
    example: {
      sv: "Precis lagom!",
      translations: { ja: "ちょうどいい！", en: "Just right!" },
    },
  },
];

/**
 * 単語ごとの想定 Q&A。
 * 3 語は意味領域が分かれているため、同じ質問に対する yes / no がはっきり割れる。
 */
const qaRules: Record<string, QaRule[]> = {
  fredagsmys: [
    {
      verdict: "yes",
      keywords: [
        "friday",
        "weekend",
        "week",
        "evening",
        "night",
        "sofa",
        "couch",
        "home",
        "indoor",
        "inside",
        "snack",
        "food",
        "eating",
        "people",
        "family",
        "together",
        "cozy",
        "cosy",
        "relax",
        "tradition",
        "custom",
        "habit",
        "noun",
        "compound",
      ],
    },
    {
      verdict: "no",
      keywords: [
        "morning",
        "summer",
        "winter",
        "outdoor",
        "outside",
        "nature",
        "water",
        "sea",
        "lake",
        "sky",
        "moon",
        "sun",
        "light",
        "animal",
        "work",
        "travel",
        "sport",
        "alone",
        "touch",
        "weather",
        "feeling",
        "verb",
        "adjective",
      ],
    },
    { verdict: "irrelevant", keywords: META_QUESTIONS },
  ],
  mangata: [
    {
      verdict: "yes",
      keywords: [
        "night",
        "moon",
        "sky",
        "light",
        "water",
        "sea",
        "lake",
        "nature",
        "outdoor",
        "outside",
        "see",
        "look",
        "visible",
        "weather",
        "beautiful",
        "road",
        "path",
        "noun",
        "compound",
      ],
    },
    {
      verdict: "no",
      keywords: [
        "morning",
        "day",
        "sun",
        "person",
        "people",
        "family",
        "food",
        "drink",
        "friday",
        "weekend",
        "sofa",
        "couch",
        "home",
        "indoor",
        "inside",
        "work",
        "sound",
        "touch",
        "animal",
        "feeling",
        "emotion",
        "verb",
        "adjective",
      ],
    },
    { verdict: "irrelevant", keywords: META_QUESTIONS },
  ],
  lagom: [
    {
      verdict: "yes",
      keywords: [
        "adjective",
        "describe",
        "amount",
        "quantity",
        "degree",
        "balance",
        "enough",
        "moderate",
        "abstract",
        "feeling",
        "value",
        "culture",
        "people",
        "everyday",
        "common",
        "often",
        "praise",
        "compliment",
      ],
    },
    {
      verdict: "no",
      keywords: [
        "noun",
        "verb",
        "compound",
        "night",
        "moon",
        "sky",
        "light",
        "water",
        "sea",
        "lake",
        "nature",
        "outdoor",
        "outside",
        "place",
        "object",
        "drink",
        "sofa",
        "couch",
        "friday",
        "weekend",
        "see",
        "touch",
        "animal",
        "work",
        "weather",
      ],
    },
    { verdict: "irrelevant", keywords: META_QUESTIONS },
  ],
};

function load(entries: Word[]): readonly Word[] {
  const parsed = entries.map((entry) => wordSchema.parse(entry));

  if (new Set(parsed.map((word) => word.id)).size !== parsed.length) {
    throw new Error("単語の id が重複している");
  }
  for (const word of parsed) {
    if (qaRules[word.id] === undefined) {
      throw new Error(`${word.id} の想定 Q&A がない`);
    }
  }

  return Object.freeze(parsed);
}

/**
 * モックが出題する単語プール。
 * `apps/api/src/words` の単語プールとは別物で、想定 Q&A を伴うモック専用のデータである。
 */
export const words = load(source);

export function findWordById(id: string): Word | undefined {
  return words.find((word) => word.id === id);
}

/** 単語の想定 Q&A。未知の id には空の配列を返し、すべての質問が `unclear` に落ちる。 */
export function rulesFor(wordId: string): readonly QaRule[] {
  return qaRules[wordId] ?? [];
}
