import { type Verdict, type Word, wordSchema } from "@kotoba/shared";

/**
 * 想定 Q&A の 1 行。質問文がキーワードのいずれかを含んだとき、この `verdict` を返す。
 *
 * 単語ごとに配列で持ち、先頭から順に見て最初に当たった行で確定する。順序が優先順位を表す。
 * 行は `no`・`yes`・`irrelevant` の順に並べる。質問が挙げる性質のうち 1 つでも当てはまらなければ
 * その問いへの答えは `no` なので、`no` の行を `yes` の行より先に見る。
 * どの行にも当たらない質問には `unclear` を返すため、対応表は 3 値だけを扱う。
 * `not_a_question` は質問と解答の分類で決まるので、ここには現れない。
 */
export type QaRule = {
  verdict: Extract<Verdict, "yes" | "no" | "irrelevant">;
  /**
   * 小文字で書く。同じ単語の別の行のキーワードと部分文字列として重ならないようにする。
   * 質問は日本語でも届くため、英語と日本語の両方で持つ。
   */
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
  "値段",
  "価格",
  "綴り",
  "スペル",
  "文字数",
  "有名",
  "検索",
  "グーグル",
  "答えを",
  "正解を",
  "ズル",
  "降参",
  "ギブアップ",
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
    meaning: {
      core: "金曜日の夜に、家族や恋人と家でスナックを囲んでくつろいで過ごす習慣。",
      accepts: ["金曜の夜に家でまったりすること", "金曜の夜のくつろぎタイム", "金曜日に家族と家でのんびり過ごすこと"],
      rejects: ["週末", "金曜日", "飲み会", "夜更かし"],
      hints: [
        "週に一度の、決まった時間の過ごし方のことだよ",
        "仕事や学校が終わった週末の入り口に、テレビの前にスナックやタコスが並ぶ",
        "その曜日の夜、家族と家でのんびりくつろぐこと",
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
    meaning: {
      core: "月の光が水面に映って、道のように伸びて見える光の帯。",
      accepts: ["水面に映る月の光の道", "月の光の道", "moonlight reflected on water"],
      rejects: ["月", "月明かり", "夕日"],
      hints: [
        "自然の中で見られる光景のことだよ",
        "晴れた夜、湖や海のほとりに立つと見える",
        "夜空の明かりが水の上に映って、まっすぐな道みたいに伸びたもの",
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
    meaning: {
      core: "量や程度が多すぎも少なすぎもせず、ちょうどいいこと。",
      accepts: ["ちょうどいい", "ほどほど", "過不足ない", "just right"],
      rejects: ["少なめ", "普通", "控えめ"],
      hints: [
        "量や程度について言う言葉で、褒めるときにも使うよ",
        "コーヒーの量、お風呂の湯加減、部屋の暖かさ——「これがいい」と言いたいときに出てくる",
        "足りないのでも、やりすぎでもない。そのあいだのいいところ",
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
        "朝",
        "夏",
        "冬",
        "屋外",
        "外で",
        "自然",
        "水",
        "海",
        "湖",
        "空",
        "月",
        "太陽",
        "光",
        "動物",
        "仕事",
        "旅",
        "スポーツ",
        "一人",
        "ひとり",
        "触",
        "天気",
        "天候",
        "感情",
        "気持ち",
        "動詞",
        "形容詞",
      ],
    },
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
        "金曜",
        "週末",
        "週",
        "夕方",
        "夜",
        "ソファ",
        "家",
        "室内",
        "屋内",
        "お菓子",
        "スナック",
        "食べ",
        "人と",
        "家族",
        "恋人",
        "一緒",
        "くつろ",
        "まったり",
        "リラックス",
        "習慣",
        "伝統",
        "名詞",
        "合成語",
      ],
    },
    { verdict: "irrelevant", keywords: META_QUESTIONS },
  ],
  mangata: [
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
        "朝",
        "昼",
        "日中",
        "太陽",
        "人",
        "家族",
        "食べ",
        "飲み",
        "金曜",
        "週末",
        "曜日",
        "ソファ",
        "家",
        "室内",
        "屋内",
        "仕事",
        "聞こえ",
        "触",
        "動物",
        "感情",
        "気持ち",
        "動詞",
        "形容詞",
      ],
    },
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
        "夜",
        "月",
        "空",
        "光",
        "水",
        "海",
        "湖",
        "自然",
        "屋外",
        "外で",
        "見え",
        "見る",
        "見られ",
        "天気",
        "天候",
        "美しい",
        "きれい",
        "道",
        "名詞",
        "合成語",
      ],
    },
    { verdict: "irrelevant", keywords: META_QUESTIONS },
  ],
  lagom: [
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
        "名詞",
        "動詞",
        "合成語",
        "夜",
        "月",
        "空",
        "光",
        "水",
        "海",
        "湖",
        "自然",
        "屋外",
        "外で",
        "場所",
        "物体",
        "飲み",
        "ソファ",
        "金曜",
        "週末",
        "見え",
        "見る",
        "触",
        "動物",
        "仕事",
        "天気",
        "天候",
      ],
    },
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
        "形容詞",
        "説明",
        "量",
        "程度",
        "加減",
        "バランス",
        "十分",
        "ちょうど",
        "適度",
        "ほどほど",
        "抽象",
        "気持ち",
        "感情",
        "価値観",
        "文化",
        "人々",
        "日常",
        "よく使",
        "褒め",
        "ほめ",
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

/** 単語プールに必ずある単語を引く。Story のように、id を決め打ちで使う場所のためのもの。 */
export function fixtureWord(id: string): Word {
  const word = findWordById(id);
  if (!word) throw new Error(`${id} が単語プールにない`);
  return word;
}

/** 単語の想定 Q&A。未知の id には空の配列を返し、すべての質問が `unclear` に落ちる。 */
export function rulesFor(wordId: string): readonly QaRule[] {
  return qaRules[wordId] ?? [];
}
