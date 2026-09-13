import { type UiLocale, type Word, wordSchema } from "@kotoba/shared";

/**
 * 出題する単語プール。
 * ここはサーバー内に閉じており、クライアントへは teaser と開示済みのヒントだけを送る。
 * DB へ移すときはこの配列をそのまま seed の入力として使う。
 */
const source: Word[] = [
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
  {
    id: "fika",
    language: "sv",
    word: "Fika",
    reading: "フィーカ",
    partOfSpeech: "noun",
    frequency: 5,
    acceptedAnswers: ["fika", "フィーカ"],
    definition: {
      ja: "コーヒーと甘いものを囲んで人と過ごす休憩時間。",
      en: "A break spent with other people over coffee and something sweet.",
    },
    note: {
      ja: "職場にも一日の決まった時間に設けられており、名詞としても動詞としても使う。",
      en: "Workplaces set aside a fixed time for it each day, and the word serves as both noun and verb.",
    },
    teaser: {
      ja: "この国では、休むことに名前がついていて、しかもそれは動詞になる",
      en: "Here, resting in company has a name — and that name is also a verb",
    },
    hints: {
      ja: [
        "毎日のように使われる、人と一緒に過ごす時間についての言葉です",
        "職場にも決まった時間があり、同僚と席を立って一緒に過ごします",
        "コーヒーと甘いものが欠かせず、名詞にも動詞にもなります",
      ],
      en: [
        "An everyday word for time spent in someone else's company",
        "Workplaces schedule it, and colleagues leave their desks to do it together",
        "Coffee and something sweet are essential, and the word doubles as a verb",
      ],
    },
    example: {
      sv: "Ska vi fika?",
      translations: {
        ja: "フィーカしよう！",
        en: "Shall we go for coffee and a bun?",
      },
    },
  },
  {
    id: "mysig",
    language: "sv",
    word: "Mysig",
    reading: "ミューシグ",
    partOfSpeech: "adjective",
    frequency: 3,
    acceptedAnswers: ["mysig", "ミューシグ"],
    definition: {
      ja: "温かくて居心地がよい雰囲気を表す形容詞。",
      en: "An adjective for a warm, comfortable, inviting atmosphere.",
    },
    note: {
      ja: "英語の cozy より情緒的で、物理的な快適さより心の状態に寄っている。",
      en: "It runs deeper than \"cozy\", describing how a moment felt rather than how warm the room was.",
    },
    teaser: {
      ja: "その部屋の温度ではなく、その部屋で過ごした心地よさの話をしている",
      en: "This is not about the temperature of the room, but about how the evening in it felt",
    },
    hints: {
      ja: [
        "場所や時間の雰囲気を褒めるときに使う形容詞です",
        "キャンドルを灯した部屋で過ごした夜を振り返って使います",
        "英語の cozy に近いものの、もっと情緒的で心の状態に寄った言葉です",
      ],
      en: [
        "An adjective you reach for when praising the mood of a place or a stretch of time",
        "You would use it looking back on an evening spent in a candlelit room",
        "English has a near equivalent in \"cozy\", but this one leans further toward how it felt inside",
      ],
    },
    example: {
      sv: "Vi hade en mysig kväll i soffan.",
      translations: {
        ja: "ソファーで過ごした夜がミューシグだった",
        en: "We had a lovely, snug evening on the sofa.",
      },
    },
  },
  {
    id: "mysa",
    language: "sv",
    word: "Mysa",
    reading: "ミューサ",
    partOfSpeech: "verb",
    frequency: 3,
    acceptedAnswers: ["mysa", "ミューサ"],
    definition: {
      ja: "ぬくぬくと心地よくくつろぐこと。",
      en: "To snuggle up and settle into being comfortable.",
    },
    teaser: {
      ja: "くつろぐ、ではまだ足りない。ぬくぬくしている状態そのものに動詞がある",
      en: "To relax is not enough. Being snug has a verb of its own here",
    },
    hints: {
      ja: [
        "動作を表す言葉で、たいてい家の中で起きることです",
        "ソファに沈み込んで温かい飲み物を飲む、あの時間そのものを指します",
        "居心地のよさを表す形容詞と語根を共有する動詞です",
      ],
      en: [
        "A word for something you do, and it usually happens indoors",
        "It names the act of sinking into the sofa with a warm drink",
        "It is a verb sharing its root with the adjective for a snug atmosphere",
      ],
    },
    example: {
      sv: "Vi mysade i soffan med varsin kopp kaffe.",
      translations: {
        ja: "ソファーでコーヒーを飲んでミューサした",
        en: "We curled up on the sofa, each with a cup of coffee.",
      },
    },
  },
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
    id: "smultronstalle",
    language: "sv",
    word: "Smultronställe",
    reading: "スムルトロンステレ",
    partOfSpeech: "noun",
    frequency: 1,
    acceptedAnswers: ["smultronställe", "スムルトロンステレ"],
    definition: {
      ja: "自分だけが知っている、お気に入りの特別な場所。",
      en: "A treasured spot that only you know about.",
    },
    literal: {
      ja: "野いちごの生える場所",
      en: "the place where wild strawberries grow",
    },
    teaser: {
      ja: "地図には載っている。ただし、あなたの地図にだけ",
      en: "It is on the map. But only on yours",
    },
    hints: {
      ja: [
        "場所を指す名詞で、人に教えたくもあり、隠しておきたくもあるものです",
        "きのこ狩りやベリー摘みの穴場を、親しい人にだけ案内するときに使います",
        "森で見つかる小さな赤い実の名前が、そのまま言葉の前半に入っています",
      ],
      en: [
        "A noun for a place — one you half want to share and half want to keep to yourself",
        "You use it when leading a close friend to your private mushroom or berry patch",
        "The first half of the word is the name of a small red fruit found in the forest",
      ],
    },
    example: {
      sv: "Jag kan visa dig mitt smultronställe för blåbär.",
      translations: {
        ja: "ブルーベリーならスムルトロンステレがあるから案内できるよ",
        en: "If it's blueberries you want, I can take you to my own secret spot.",
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
    id: "solkatt",
    language: "sv",
    word: "Solkatt",
    reading: "スールカット",
    partOfSpeech: "noun",
    frequency: 2,
    acceptedAnswers: ["solkatt", "スールカット"],
    definition: {
      ja: "鏡や腕時計が光を反射して、壁の上で揺れる光の斑点。",
      en: "The trembling patch of light a mirror or a watch face throws onto the wall.",
    },
    literal: { ja: "太陽の猫", en: "sun cat" },
    teaser: {
      ja: "壁の上でちらちら動いているが、生き物ではない",
      en: "Something flickers along the wall, and it is not alive",
    },
    hints: {
      ja: [
        "室内で見かける、小さくて動くものを指す名詞です",
        "腕時計やスマートフォンの画面が光を反射したときに壁にできます",
        "直訳は「太陽の◯◯」。ちらちらと動くさまを、ある動物にたとえています",
      ],
      en: [
        "A noun for a small moving thing you notice indoors",
        "A watch face or a phone screen catching the light will put one on your wall",
        "It literally means \"the sun's ___\", likening the flickering to a certain animal",
      ],
    },
    example: {
      sv: "Det dansar en solkatt på väggen från min mobil.",
      translations: {
        ja: "スマートフォンの反射で壁にスールカットができてる",
        en: "My phone is dancing a spot of sunlight across the wall.",
      },
    },
  },
  {
    id: "gokotta",
    language: "sv",
    word: "Gökotta",
    reading: "ヨークオッタ",
    partOfSpeech: "noun",
    frequency: 1,
    acceptedAnswers: ["gökotta", "ヨークオッタ", "イェークオッタ"],
    definition: {
      ja: "早朝に野外へ出て、鳥のさえずりを聞いて過ごす習慣。",
      en: "The custom of going outdoors at daybreak to listen to birdsong.",
    },
    literal: { ja: "カッコウの早朝", en: "cuckoo daybreak" },
    teaser: {
      ja: "その朝、彼が森へ行った目的は、耳だけで足りる",
      en: "That morning he walked into the forest, and his ears were all he needed",
    },
    hints: {
      ja: [
        "一日のうち、ごく早い時間帯についての言葉です",
        "春から初夏にかけて、朝早く森や野原へ出かける習慣を指します",
        "「早朝」を意味する語の前に、初夏に鳴くある鳥の名前がついています",
      ],
      en: [
        "The word concerns a very early part of the day",
        "From spring into early summer, people head out to the woods or fields at first light",
        "A word meaning daybreak is preceded by the name of a bird heard in early summer",
      ],
    },
    example: {
      sv: "Han gav sig av till skogen för gökotta.",
      translations: {
        ja: "彼はヨークオッタで森に出かけていった",
        en: "He set off into the forest for an early morning of birdsong.",
      },
    },
  },
  {
    id: "kura-skymning",
    language: "sv",
    word: "Kura skymning",
    reading: "クーラ・シムニング",
    partOfSpeech: "phrase",
    frequency: 1,
    acceptedAnswers: ["kura skymning", "クーラシムニング", "クーラスキムニング"],
    definition: {
      ja: "夕暮れどきに明かりをつけず、薄闇の中で静かに過ごすこと。",
      en: "Sitting quietly in the failing light of dusk without turning on any lamps.",
    },
    teaser: {
      ja: "日が落ちても、あえて手を伸ばさないスイッチがある",
      en: "The sun goes down, and the switch stays untouched on purpose",
    },
    hints: {
      ja: [
        "一日の終わりの、ある時間帯の過ごし方を表します",
        "暗くなっていく部屋で明かりをつけないまま、じっと座っている時間です",
        "「身を寄せる」という動詞と「薄暮」を意味する名詞、二語からなる言い回しです",
      ],
      en: [
        "It describes how you spend one particular stretch at the end of the day",
        "You stay in a room as it grows dark, leaving the lamps off",
        "It is two words: a verb meaning to huddle, and a noun meaning twilight",
      ],
    },
  },
];

function load(entries: Word[]): readonly Word[] {
  const parsed = entries.map((entry) => wordSchema.parse(entry));
  // id の重複は出題済み単語の記録を壊すため、起動時に落とす。
  if (new Set(parsed.map((word) => word.id)).size !== parsed.length) {
    throw new Error("単語の id が重複している");
  }

  return Object.freeze(parsed);
}

export const words = load(source);

export function findWordById(id: string): Word | undefined {
  return words.find((word) => word.id === id);
}

/** UI 言語を解決した単語。秘密を含むため、この形のままクライアントへ送らない。 */
export type LocalizedWord = {
  id: string;
  word: string;
  /** 日本語 UI でのみ付く。英語 UI ではスウェーデン語の綴りだけを見せる */
  reading?: string;
  partOfSpeech: Word["partOfSpeech"];
  frequency: number;
  definition: string;
  teaser: string;
  hints: readonly [string, string, string];
  literal?: string;
  note?: string;
  example?: { sv: string; translation: string };
};

/**
 * UI 言語ごとのテキストを一つに畳む。
 * teaser・ヒント・終了カードはここから必要な分だけを取り出してクライアントへ渡す。
 */
export function resolveWord(word: Word, locale: UiLocale): LocalizedWord {
  return {
    id: word.id,
    word: word.word,
    ...(locale === "ja" ? { reading: word.reading } : {}),
    partOfSpeech: word.partOfSpeech,
    frequency: word.frequency,
    definition: word.definition[locale],
    teaser: word.teaser[locale],
    hints: word.hints[locale],
    ...(word.literal ? { literal: word.literal[locale] } : {}),
    ...(word.note ? { note: word.note[locale] } : {}),
    ...(word.example
      ? { example: { sv: word.example.sv, translation: word.example.translations[locale] } }
      : {}),
  };
}
