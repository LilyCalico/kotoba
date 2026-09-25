import { type Verdict, type Word, wordSchema } from "@kotoba/shared";

/**
 * 質問への回答を引くための対応表。
 * 先頭のルールから順に見て、キーワードのいずれかを含んだ時点で確定する。
 * どのルールにも当たらない質問には `unclear` を返す。
 */
export type QaRule = {
  verdict: Extract<Verdict, "yes" | "no" | "irrelevant">;
  keywords: string[];
};

/** 単語の正体に触れない、どの単語でも成立しないメタな問い。 */
const META_QUESTIONS = [
  "price",
  "expensive",
  "cheap",
  "buy",
  "spell",
  "letters",
  "famous",
  "google",
  "answer",
  "cheat",
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

const qaRules: Record<string, QaRule[]> = {
  fredagsmys: [
    {
      verdict: "yes",
      keywords: [
        "friday",
        "weekend",
        "week",
        "sofa",
        "couch",
        "home",
        "indoor",
        "inside",
        "snack",
        "eat",
        "evening",
        "night",
        "cozy",
        "cosy",
        "family",
        "together",
        "people",
        "tradition",
        "custom",
        "habit",
        "relax",
        "rest",
        "compound",
        "noun",
        "thing you do",
      ],
    },
    {
      verdict: "no",
      keywords: [
        "morning",
        "outdoor",
        "outside",
        "nature",
        "water",
        "sea",
        "lake",
        "moon",
        "sun",
        "sky",
        "light",
        "animal",
        "verb",
        "adjective",
        "work",
        "travel",
        "alone",
        "sport",
        "summer",
        "winter",
        "touch",
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
        "water",
        "sea",
        "lake",
        "light",
        "nature",
        "outdoor",
        "outside",
        "sky",
        "see",
        "visible",
        "look",
        "weather",
        "beautiful",
        "road",
        "path",
        "compound",
        "noun",
      ],
    },
    {
      verdict: "no",
      keywords: [
        "person",
        "people",
        "eat",
        "drink",
        "friday",
        "weekend",
        "sofa",
        "couch",
        "home",
        "indoor",
        "inside",
        "verb",
        "adjective",
        "feeling",
        "emotion",
        "touch",
        "work",
        "sound",
        "hear",
        "animal",
        "morning",
        "day",
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
        "praise",
        "compliment",
        "feeling",
        "value",
        "culture",
        "people",
        "everyday",
        "common",
        "often",
        "balance",
        "enough",
        "moderate",
        "abstract",
      ],
    },
    {
      verdict: "no",
      keywords: [
        "noun",
        "verb",
        "night",
        "moon",
        "water",
        "sea",
        "lake",
        "eat",
        "drink",
        "sofa",
        "couch",
        "friday",
        "weekend",
        "place",
        "object",
        "touch",
        "see",
        "animal",
        "nature",
        "compound",
        "outdoor",
        "outside",
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
  if (parsed.some((word) => qaRules[word.id] === undefined)) {
    throw new Error("Q&A 対応表のない単語がある");
  }

  return Object.freeze(parsed);
}

/** モックが出題する単語。API が実装されるまでの仮の単語プール。 */
export const words = load(source);

export function findWordById(id: string): Word | undefined {
  return words.find((word) => word.id === id);
}

export function rulesFor(wordId: string): QaRule[] {
  return qaRules[wordId] ?? [];
}
