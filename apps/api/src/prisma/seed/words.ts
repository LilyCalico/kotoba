import { type Word, wordSchema } from "@kotoba/shared";

/**
 * seed で words テーブルへ入れる単語。アプリは実行時にこの配列を読まず、DB から引く。
 * 単語を足す・直すときはここを書き換えて `pnpm db:seed` を流す。
 * ビルド成果物には含めない（tsconfig.build.json で除外している）。
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
    meaning: {
      core: "コーヒーやお茶と甘いものを囲んで、人と一緒にとる休憩。",
      accepts: ["お茶の時間", "コーヒーブレイク", "おやつ休憩", "coffee break"],
      rejects: ["コーヒー", "お菓子", "ランチ"],
      hints: [
        "何かをする時間のことで、名詞にも動詞にもなるよ",
        "職場でも家でも、午後になると「そろそろしよう」と声がかかる",
        "飲み物と甘いものを囲んで、手を止めておしゃべりするひととき",
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
    meaning: {
      core: "温かくて居心地がよく、心がくつろぐ雰囲気であること。",
      accepts: ["居心地がいい", "心地よい", "ほっこりする", "cozy"],
      rejects: ["暖かい", "かわいい", "楽しい"],
      hints: [
        "場所や時間の雰囲気を言う形容詞だよ",
        "キャンドルを灯した部屋、雨の日の毛布、友だちと過ごす冬の夜",
        "ぬくもりがあって、そこにいると気持ちがほどける感じ",
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
    meaning: {
      core: "ぬくぬくと心地よく、くつろいで過ごすこと。",
      accepts: ["くつろぐ", "まったりする", "ぬくぬく過ごす", "chill"],
      rejects: ["寝る", "休む", "遊ぶ"],
      hints: [
        "何かをすることを表す動詞だよ",
        "寒い日にブランケットにくるまって、温かい飲み物を手にソファで",
        "居心地のいい場所で、ぬくぬくとゆっくり過ごすこと",
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
    example: {
      sv: "Mångatan glittrade över sjön när vi rodde hem.",
      translations: {
        ja: "ボートで帰る途中、湖の上にモーンガータがきらめいていた",
        en: "As we rowed home, the moonlight lay glittering across the lake.",
      },
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
    example: {
      sv: "Vi satt i köket och kurade skymning innan vi tände lampan.",
      translations: {
        ja: "明かりをつける前に、台所でクーラ・シムニングしていた",
        en: "We sat in the kitchen in the gathering dusk before switching on the lamp.",
      },
    },
  },
  {
    id: "patar",
    language: "sv",
    word: "Påtår",
    reading: "ポートール",
    partOfSpeech: "noun",
    frequency: 3,
    acceptedAnswers: ["påtår", "ポートール"],
    definition: {
      ja: "コーヒーのおかわり。",
      en: "A refill of coffee.",
    },
    literal: { ja: "上乗せのひとくち", en: "a sip on top" },
    note: {
      ja: "カフェでは無料か安く注いでもらえることが多く、それを指す専用の語がある。",
      en: "Cafés often pour it free or cheaply, and the language keeps a word just for it.",
    },
    teaser: {
      ja: "2 杯目のコーヒーには、1 杯目とは別の名前がある",
      en: "The second cup of coffee goes by a different name from the first",
    },
    hints: {
      ja: [
        "飲み物にまつわる名詞で、カフェや職場でよく耳にします",
        "カップが空になったころ、「もう一杯いる？」と声をかけるときに使います",
        "「上に」を表す前置詞と、「ひとしずく」を意味する語をつなげた言葉です",
      ],
      en: [
        "A noun about a drink, heard often in cafés and at work",
        "You use it when a cup is empty and someone offers to pour more",
        "It joins a preposition meaning \"on\" with a word for a small drop",
      ],
    },
    example: {
      sv: "Är det någon som vill ha påtår?",
      translations: {
        ja: "ポートール欲しい人いる？",
        en: "Does anyone want a refill?",
      },
    },
  },
  {
    id: "tretar",
    language: "sv",
    word: "Tretår",
    reading: "トレートール",
    partOfSpeech: "noun",
    frequency: 2,
    acceptedAnswers: ["tretår", "トレートール"],
    definition: {
      ja: "おかわりのさらにおかわり。3 杯目のコーヒー。",
      en: "The refill after the refill — a third cup of coffee.",
    },
    literal: { ja: "3 つめのひとくち", en: "third sip" },
    teaser: {
      ja: "2 杯目に名前があるなら、その次にもある",
      en: "If the second cup has a name, so does the one after it",
    },
    hints: {
      ja: [
        "飲み物にまつわる名詞で、ある数と結びついています",
        "長い会議やおしゃべりが続いて、コーヒーをもう一度注ぎ足すときに使います",
        "数の「3」と、「ひとしずく」を意味する語をつなげた言葉です",
      ],
      en: [
        "A noun about a drink, tied to a particular number",
        "You use it when a long meeting or chat calls for yet another top-up of coffee",
        "It joins the number three with a word for a small drop",
      ],
    },
    example: {
      sv: "I morse blev det både påtår och tretår.",
      translations: {
        ja: "今朝はおかわりどころか、トレートールまで飲んだ",
        en: "This morning I had a refill, and then another one.",
      },
    },
  },
  {
    id: "lordagsgodis",
    language: "sv",
    word: "Lördagsgodis",
    reading: "ロールダグスグーディス",
    partOfSpeech: "noun",
    frequency: 5,
    acceptedAnswers: ["lördagsgodis", "ロールダグスグーディス"],
    definition: {
      ja: "土曜日にだけ楽しむお菓子。また、お菓子を土曜日に取っておく習慣。",
      en: "Sweets saved for Saturday, and the custom of keeping them for that day.",
    },
    literal: { ja: "土曜日のお菓子", en: "Saturday sweets" },
    note: {
      ja: "スーパーの量り売りのお菓子（lösgodis）を、自分で袋に詰めて買うのが定番。",
      en: "The classic way is to scoop pick-and-mix (lösgodis) into a bag at the supermarket.",
    },
    teaser: {
      ja: "子どもたちは、週に一度のその日を指折り数えて待っている",
      en: "Children count the days until it comes round each week",
    },
    hints: {
      ja: [
        "食べ物にまつわる名詞で、子どもにとっては特別な楽しみです",
        "スーパーの量り売りの棚で、好きなものを選んで袋に詰めて買います",
        "週末のある曜日の名前と、「お菓子」を意味する語をつなげた合成語です",
      ],
      en: [
        "A noun about food, and a special treat for children",
        "You fill a bag yourself from the supermarket's pick-and-mix wall",
        "It is a compound of the name of a weekend day and a word for sweets",
      ],
    },
    example: {
      sv: "Mitt bästa lördagsgodis är lösgodiset som man väger upp själv på ICA.",
      translations: {
        ja: "私のお気に入りのロールダグスグーディスは、ICA で量って買うやつだ",
        en: "My favourite Saturday sweets are the pick-and-mix you weigh out yourself at ICA.",
      },
    },
  },
  {
    id: "lillordag",
    language: "sv",
    word: "Lillördag",
    reading: "リルロールダグ",
    partOfSpeech: "noun",
    frequency: 4,
    acceptedAnswers: ["lillördag", "リルロールダグ"],
    definition: {
      ja: "週の真ん中の水曜日を、ちょっとだけ楽しむ日として呼ぶ言い方。",
      en: "Wednesday, treated as a small celebration in the middle of the week.",
    },
    literal: { ja: "小さな土曜日", en: "little Saturday" },
    teaser: {
      ja: "週末はまだ遠いのに、その日は少しだけ浮かれていい",
      en: "The weekend is still far off, yet on this day you may celebrate a little",
    },
    hints: {
      ja: [
        "暦の上の、ある日を指す名詞です",
        "平日なのに、外食したりお酒を一杯飲みに行ったりする口実になります",
        "「小さな」を意味する語と、週末のある曜日の名前をつなげた合成語です",
      ],
      en: [
        "A noun for a particular day on the calendar",
        "It is the excuse for dinner out or a drink, even though it is a weekday",
        "It joins a word meaning \"little\" with the name of a weekend day",
      ],
    },
    example: {
      sv: "Jag dricker inte på vardagar, men i dag är det lillördag, så jag kanske går till baren.",
      translations: {
        ja: "平日はお酒を飲まないけど、今日はリルロールダグだからバーに行こうかな",
        en: "I don't drink on weekdays, but it's little Saturday today, so I might go to the bar.",
      },
    },
  },
  {
    id: "sambo",
    language: "sv",
    word: "Sambo",
    reading: "サンボ",
    partOfSpeech: "noun",
    frequency: 5,
    acceptedAnswers: ["sambo", "サンボ"],
    definition: {
      ja: "結婚せずに同居しているパートナー。",
      en: "A partner you live with without being married.",
    },
    literal: { ja: "一緒に住む人", en: "live-together" },
    note: {
      ja: "法律上の正式な呼び名でもあり、同居のパートナーには法律で一定の権利が認められている。",
      en: "It is also the legal term, and the law grants cohabiting partners certain rights.",
    },
    teaser: {
      ja: "指輪は交わしていない。それでも法律は、その二人に名前をつけた",
      en: "No rings were exchanged, yet the law gave the two of them a name",
    },
    hints: {
      ja: [
        "人と人との関係を表す名詞です",
        "役所の書類や自己紹介で、一緒に暮らす相手を紹介するときに使います",
        "「一緒に」を意味する語と「住む」を意味する語を、縮めてつなげた言葉です",
      ],
      en: [
        "A noun describing a relationship between people",
        "You use it on official forms, or when introducing the person you share a home with",
        "It shortens and joins words meaning \"together\" and \"to live\"",
      ],
    },
    example: {
      sv: "Man behöver inte gifta sig – även som sambo har man rättigheter enligt lag.",
      translations: {
        ja: "結婚しなくても、サンボとして法的に権利が認められている",
        en: "You don't have to marry — partners who live together have rights in law too.",
      },
    },
  },
  {
    id: "sarbo",
    language: "sv",
    word: "Särbo",
    reading: "セールボ",
    partOfSpeech: "noun",
    frequency: 4,
    acceptedAnswers: ["särbo", "セールボ"],
    definition: {
      ja: "恋人同士でありながら、あえて別々に暮らしているパートナー。",
      en: "A committed partner who deliberately keeps a separate home.",
    },
    literal: { ja: "別々に住む人", en: "live-apart" },
    teaser: {
      ja: "二人は恋人同士。でも、帰る家のドアはそれぞれ違う",
      en: "They are a couple, but each goes home to a different door",
    },
    hints: {
      ja: [
        "恋愛関係にある相手を表す名詞です",
        "遠くに住んでいたり、お互い自分の家を手放したくなかったりする恋人について使います",
        "「別々に」を意味する語と「住む」を意味する語を、縮めてつなげた言葉です",
      ],
      en: [
        "A noun for someone you are in a relationship with",
        "You use it for a partner who lives far away, or when neither wants to give up their own home",
        "It shortens and joins words meaning \"apart\" and \"to live\"",
      ],
    },
    example: {
      sv: "Min partner bor långt bort, så just nu är vi särbo.",
      translations: {
        ja: "パートナーは遠くに住んでいるので、今はセールボだ",
        en: "My partner lives far away, so for now we live apart.",
      },
    },
  },
  {
    id: "vabba",
    language: "sv",
    word: "Vabba",
    reading: "ヴァッバ",
    partOfSpeech: "verb",
    frequency: 5,
    acceptedAnswers: ["vabba", "ヴァッバ", "バッバ"],
    definition: {
      ja: "子どもの看病のために、手当を受けて仕事を休むこと。",
      en: "To stay home from work, on a state allowance, to look after a sick child.",
    },
    note: {
      ja: "看病のための手当の制度名（vård av barn）の頭文字からできた動詞で、ひと言で休む理由が伝わる。",
      en: "It is built from the initials of the allowance for caring for a child (vård av barn), so one word explains the absence.",
    },
    teaser: {
      ja: "職場に送るメッセージは、この一語だけで事情が全部伝わる",
      en: "One word in a message to work, and everyone understands the whole situation",
    },
    hints: {
      ja: [
        "仕事を休むことに関わる動詞です",
        "保育園から「お子さんが熱を出しました」と電話が来た朝に使います",
        "子どもの看病のための手当の制度名を、頭文字で縮めて動詞にしたものです",
      ],
      en: [
        "A verb to do with taking time off work",
        "You use it on the morning the nursery calls to say your child has a fever",
        "It turns the initials of the allowance for caring for a sick child into a verb",
      ],
    },
    example: {
      sv: "Jag måste vabba i dag, min dotter har feber.",
      translations: {
        ja: "娘が熱を出したので、今日はヴァッバしないといけない",
        en: "I have to stay home today — my daughter has a fever.",
      },
    },
  },
  {
    id: "vobba",
    language: "sv",
    word: "Vobba",
    reading: "ヴォッバ",
    partOfSpeech: "verb",
    frequency: 5,
    acceptedAnswers: ["vobba", "ヴォッバ", "ボッバ"],
    definition: {
      ja: "子どもの看病をしながら、家で仕事をすること。",
      en: "To work from home while looking after a sick child.",
    },
    note: {
      ja: "看病で仕事を休むことを表す vabba と、「働く」の jobba を混ぜた造語。",
      en: "A blend of vabba, staying home for a sick child, and jobba, to work.",
    },
    teaser: {
      ja: "片手で熱を測り、もう片方の手でメールを返す",
      en: "One hand takes a temperature, the other answers email",
    },
    hints: {
      ja: [
        "働き方に関わる動詞です",
        "子どもが熱を出したけれど、どうしても外せない仕事がある日に使います",
        "子どもの看病で休むことを表す動詞と、「働く」を意味する動詞を混ぜた造語です",
      ],
      en: [
        "A verb about a way of working",
        "You use it when your child is ill but there is work you simply cannot drop",
        "It blends the verb for staying home with a sick child and the verb meaning \"to work\"",
      ],
    },
    example: {
      sv: "Hon är inte på kontoret i dag, hon vobbar.",
      translations: {
        ja: "彼女は今日は出社ではなく、ヴォッバだ",
        en: "She isn't in the office today — she's working from home with a sick child.",
      },
    },
  },
  {
    id: "sommarstuga",
    language: "sv",
    word: "Sommarstuga",
    reading: "ソンマルストゥーガ",
    partOfSpeech: "noun",
    frequency: 5,
    acceptedAnswers: ["sommarstuga", "ソンマルストゥーガ"],
    definition: {
      ja: "湖畔や森にある、夏を過ごすための小さな別荘。",
      en: "A small cottage by a lake or in the woods, kept for spending the summer.",
    },
    literal: { ja: "夏の小屋", en: "summer cottage" },
    note: {
      ja: "赤い壁に白い窓枠の木造が定番で、長い夏休みをここで過ごす家族が多い。",
      en: "The classic one is wooden, painted red with white trim, and many families spend the long summer holiday there.",
    },
    teaser: {
      ja: "一年のほとんどは空き家。それでも家族の思い出はここに集まる",
      en: "It stands empty most of the year, yet the family's memories gather here",
    },
    hints: {
      ja: [
        "建物を指す名詞で、多くの家族にとって特別な場所です",
        "夏休みになると、街の家を離れて湖のそばや森の中で何週間も過ごします",
        "季節の名前と、「小屋」を意味する語をつなげた合成語です",
      ],
      en: [
        "A noun for a building, and a special place for many families",
        "When the summer holiday comes, people leave their city homes to spend weeks by a lake or in the woods",
        "It is a compound of the name of a season and a word for a cottage",
      ],
    },
    example: {
      sv: "När jag var liten älskade jag att vara i farfars sommarstuga på sommarlovet.",
      translations: {
        ja: "小さい頃、夏休みに祖父のソンマルストゥーガで過ごすのが好きだった",
        en: "As a child, I loved spending the summer holidays at my grandfather's cottage.",
      },
    },
  },
  {
    id: "allemansratten",
    language: "sv",
    word: "Allemansrätten",
    reading: "アッレマンスレッテン",
    partOfSpeech: "noun",
    frequency: 5,
    acceptedAnswers: ["allemansrätten", "allemansrätt", "アッレマンスレッテン", "アレマンスレッテン"],
    definition: {
      ja: "誰でも他人の土地の森や湖を自由に歩き、キャンプし、ベリーを摘める自然享受権。",
      en: "The right of public access that lets anyone walk, camp and pick berries on land they do not own.",
    },
    literal: { ja: "万人の権利", en: "everyone's right" },
    note: {
      ja: "憲法にも記されていて、「荒らさない・邪魔しない」という責任とセットで守られている。",
      en: "It is written into the constitution, and it comes with the duty not to disturb or destroy.",
    },
    teaser: {
      ja: "柵のない森なら、持ち主でなくても歩いていい",
      en: "In an unfenced forest, you may walk even if it is not yours",
    },
    hints: {
      ja: [
        "法律や社会の仕組みに関わる名詞です",
        "他人の土地の森でキャンプをしたり、ベリーやきのこを摘んだりできるのはこのおかげです",
        "「すべての人」を意味する語と、「権利」を意味する語をつなげた合成語です",
      ],
      en: [
        "A noun to do with law and how society works",
        "It is the reason you can camp in someone else's forest, or pick the berries and mushrooms there",
        "It is a compound of words meaning \"everyone\" and \"right\"",
      ],
    },
    example: {
      sv: "Tack vare allemansrätten kunde vi plocka massor av hallon.",
      translations: {
        ja: "アッレマンスレッテンのおかげで、たくさんラズベリーが収穫できた",
        en: "Thanks to the right of public access, we could pick loads of raspberries.",
      },
    },
  },
  {
    id: "tupplur",
    language: "sv",
    word: "Tupplur",
    reading: "トゥップルール",
    partOfSpeech: "noun",
    frequency: 4,
    acceptedAnswers: ["tupplur", "トゥップルール"],
    definition: {
      ja: "短くて気持ちのいいうたた寝。時間帯は問わない。",
      en: "A short, refreshing doze, at any time of day.",
    },
    literal: { ja: "おんどりの昼寝", en: "rooster's nap" },
    note: {
      ja: "ふつうの昼寝より短いものを指す。",
      en: "It is shorter than an ordinary nap.",
    },
    teaser: {
      ja: "眠りは深くない。でも、起きたときにはすっきりしている",
      en: "The sleep is never deep, but you wake up refreshed",
    },
    hints: {
      ja: [
        "休むことにまつわる名詞です",
        "仕事から帰ってソファで少しだけ眠る、あの短い時間に使います",
        "直訳は「◯◯の昼寝」。夜明けに鳴くことで知られる鳥が入っています",
      ],
      en: [
        "A noun to do with resting",
        "You use it for the brief sleep on the sofa after getting home from work",
        "It literally means \"a ___'s nap\", naming a bird known for crowing at dawn",
      ],
    },
    example: {
      sv: "Jag är trött, så jag vill ta en tupplur när jag kommer hem.",
      translations: {
        ja: "疲れたので、家に帰ったらトゥップルールしたい",
        en: "I'm tired, so I want to have a quick nap when I get home.",
      },
    },
  },
  {
    id: "blunda",
    language: "sv",
    word: "Blunda",
    reading: "ブルンダ",
    partOfSpeech: "verb",
    frequency: 5,
    acceptedAnswers: ["blunda", "ブルンダ"],
    definition: {
      ja: "目を閉じること。ほんの少しだけ眠ることにも使う。",
      en: "To close your eyes, or to rest them for a moment's sleep.",
    },
    teaser: {
      ja: "まぶたを下ろすだけの動作に、専用の動詞がある",
      en: "Simply lowering your eyelids has a verb all its own",
    },
    hints: {
      ja: [
        "体の動きを表す、短い動詞です",
        "かくれんぼで鬼が数を数えるときや、写真で目をつぶってしまったときに使います",
        "日本語では「目を」と「閉じる」の二語になるところを、一語で言います",
      ],
      en: [
        "A short verb for a movement of the body",
        "You use it for the seeker counting in hide-and-seek, or someone caught mid-blink in a photo",
        "Where English needs \"close\" plus \"eyes\", this does it in one word",
      ],
    },
    example: {
      sv: "Blunda en sekund.",
      translations: {
        ja: "一秒だけブルンダして",
        en: "Close your eyes for a second.",
      },
    },
  },
  {
    id: "hinna",
    language: "sv",
    word: "Hinna",
    reading: "ヒンナ",
    partOfSpeech: "verb",
    frequency: 5,
    acceptedAnswers: ["hinna", "ヒンナ"],
    definition: {
      ja: "時間内に間に合うこと。また、何かをする時間があること。",
      en: "To make it in time, or to have time to get something done.",
    },
    teaser: {
      ja: "時計を見て「大丈夫、まだいける」。それを一語で言う",
      en: "You glance at the clock: \"It's fine, there's still time\" — in a single word",
    },
    hints: {
      ja: [
        "時間に関わる動詞です",
        "電車に間に合うか、締め切りまでに終えられるかを話すときに使います",
        "日本語では「間に合う」と「〜する時間がある」に分かれる意味を、一語で受け持ちます",
      ],
      en: [
        "A verb to do with time",
        "You use it when asking whether you'll catch the train or finish before the deadline",
        "It covers both \"to make it in time\" and \"to have time to do\" in one word",
      ],
    },
    example: {
      sv: "Jag hinner, så jag kan hjälpa till med den uppgiften.",
      translations: {
        ja: "私ヒンナできるから、そのタスク手伝います",
        en: "I've got time, so I can help with that task.",
      },
    },
  },
  {
    id: "orka",
    language: "sv",
    word: "Orka",
    reading: "オルカ",
    partOfSpeech: "verb",
    frequency: 5,
    acceptedAnswers: ["orka", "オルカ"],
    definition: {
      ja: "何かをするだけの気力や体力があること。",
      en: "To have the energy or strength to do something.",
    },
    note: {
      ja: "「orkar inte（〜する気力がない）」と、否定の形で使うことが多い。",
      en: "It turns up most often in the negative, \"orkar inte\" — not having it in you.",
    },
    teaser: {
      ja: "やる気が残っているかどうか。それを尋ねる動詞がある",
      en: "Have you got it in you or not? There is a verb that asks exactly that",
    },
    hints: {
      ja: [
        "気持ちや体の状態に関わる動詞です",
        "疲れて帰った夜、「今日は料理する元気がない」と言うときに使います",
        "英語なら \"have the energy to\" と何語も要るところを、一語で言います",
      ],
      en: [
        "A verb about the state of your mind and body",
        "You use it on a tired evening, saying you haven't got it in you to cook",
        "Where English needs \"have the energy to\", this needs one word",
      ],
    },
    example: {
      sv: "Jag orkar inte laga mat.",
      translations: {
        ja: "料理を作るオルカがない",
        en: "I can't face cooking.",
      },
    },
  },
  {
    id: "trivas",
    language: "sv",
    word: "Trivas",
    reading: "トリーヴァス",
    partOfSpeech: "verb",
    frequency: 5,
    acceptedAnswers: ["trivas", "トリーヴァス", "トリーバス"],
    definition: {
      ja: "場所や環境、人間関係になじんで、心地よく感じること。",
      en: "To feel at home and content in a place, a setting or among people.",
    },
    teaser: {
      ja: "ここにいていいと思える。その感覚を動詞で言う",
      en: "The feeling that you belong here, said with a verb",
    },
    hints: {
      ja: [
        "気持ちを表す動詞で、場所や周りの人との関係について使います",
        "新しい職場や引っ越し先について「うまくやれている？」と聞かれたときの答えに使います",
        "語尾は受け身のような形をしていますが、意味は自分が心地よく感じることです",
      ],
      en: [
        "A verb about a feeling, used of places and of the people around you",
        "You use it in reply when asked how you're getting on in a new job or a new town",
        "Its ending looks passive, but it means you yourself feel at ease",
      ],
    },
    example: {
      sv: "Jag trivs på jobbet.",
      translations: {
        ja: "職場でトリーヴァスに感じる",
        en: "I'm happy at work.",
      },
    },
  },
  {
    id: "pigg",
    language: "sv",
    word: "Pigg",
    reading: "ピッグ",
    partOfSpeech: "adjective",
    frequency: 4,
    acceptedAnswers: ["pigg", "ピッグ"],
    definition: {
      ja: "元気ではつらつとして、目がしっかり覚めている様子。",
      en: "Lively, alert and wide awake.",
    },
    teaser: {
      ja: "よく眠れた朝、体がそれを教えてくれる",
      en: "After a good night's sleep, your body tells you so",
    },
    hints: {
      ja: [
        "人の状態を表す形容詞です",
        "よく眠れた朝や、コーヒーを飲んで頭が冴えたときに使います",
        "眠気がないことと元気があることの両方を、一語で表します",
      ],
      en: [
        "An adjective for how a person is feeling",
        "You use it after a good night's sleep, or once coffee has cleared your head",
        "It means both free of sleepiness and full of energy, in one word",
      ],
    },
    example: {
      sv: "Jag är så pigg i morse!",
      translations: {
        ja: "今日の朝はピッグだ",
        en: "I feel so wide awake this morning!",
      },
    },
  },
  {
    id: "morgonpigg",
    language: "sv",
    word: "Morgonpigg",
    reading: "モルゴンピッグ",
    partOfSpeech: "adjective",
    frequency: 3,
    acceptedAnswers: ["morgonpigg", "モルゴンピッグ"],
    definition: {
      ja: "朝から元気な、朝型の。",
      en: "Bright and lively first thing in the morning; a morning person.",
    },
    literal: { ja: "朝に元気", en: "morning-lively" },
    teaser: {
      ja: "目覚ましが鳴る前に、もう起きている人がいる",
      en: "Some people are up before the alarm goes off",
    },
    hints: {
      ja: [
        "人の性質を表す形容詞です",
        "早起きが苦にならず、朝いちばんから機嫌のいい人について使います",
        "一日のある時間帯の名前と、「元気な」を意味する形容詞をつなげた合成語です",
      ],
      en: [
        "An adjective describing someone's nature",
        "You use it for someone who finds early rising easy and is cheerful from the first minute",
        "It is a compound of a time of day and an adjective meaning lively",
      ],
    },
    example: {
      sv: "Hon är morgonpigg.",
      translations: {
        ja: "彼女はモルゴンピッグだ",
        en: "She's a morning person.",
      },
    },
  },
  {
    id: "sugen",
    language: "sv",
    word: "Sugen",
    reading: "スーゲン",
    partOfSpeech: "adjective",
    frequency: 5,
    acceptedAnswers: ["sugen", "スーゲン"],
    definition: {
      ja: "何かを食べたい、したいという気分になっていること。",
      en: "In the mood for something; craving it.",
    },
    note: {
      ja: "fikasugen（フィーカしたい気分）のように、ほかの語とつなげて使える。",
      en: "It joins onto other words, as in fikasugen — in the mood for a fika.",
    },
    teaser: {
      ja: "お腹が空いているのとは違う。あれが欲しい、という気分のこと",
      en: "It isn't hunger. It is wanting that one particular thing",
    },
    hints: {
      ja: [
        "気分を表す形容詞です",
        "急に甘いものやピザが欲しくなったときや、何かをやってみたくなったときに使います",
        "ほかの語の後ろにつなげて、「〜したい気分」という新しい語を作れます",
      ],
      en: [
        "An adjective for a mood",
        "You use it when you suddenly crave something sweet or a pizza, or want to try something",
        "It attaches to other words to make new ones meaning \"in the mood for ___\"",
      ],
    },
    example: {
      sv: "Jag är sugen på godis.",
      translations: {
        ja: "お菓子食べたい気分だ",
        en: "I'm in the mood for sweets.",
      },
    },
  },
  {
    id: "dygn",
    language: "sv",
    word: "Dygn",
    reading: "ディウン",
    partOfSpeech: "noun",
    frequency: 5,
    acceptedAnswers: ["dygn", "ディウン"],
    definition: {
      ja: "昼と夜を合わせた、まる一日（24 時間）。",
      en: "A full day and night together — twenty-four hours.",
    },
    teaser: {
      ja: "「一日」では昼だけに聞こえる。夜まで含めると、別の言葉になる",
      en: "\"Day\" can sound like daylight only. Include the night, and there is another word",
    },
    hints: {
      ja: [
        "時間の長さを表す名詞です",
        "24 時間営業の店や、時差ぼけで崩れた生活リズムについて話すときに使います",
        "日本語や英語では「昼夜」「24 時間」と言い換えるしかない長さを、一語で表します",
      ],
      en: [
        "A noun for a length of time",
        "You use it for a shop open round the clock, or a body clock thrown off by jet lag",
        "English needs \"twenty-four hours\" for it; this language has a single word",
      ],
    },
    example: {
      sv: "Om ett dygn åker jag till Japan.",
      translations: {
        ja: "1 ディウン後に日本へ行く予定だ",
        en: "In twenty-four hours I'm off to Japan.",
      },
    },
  },
  {
    id: "knytkalas",
    language: "sv",
    word: "Knytkalas",
    reading: "クニュートカラース",
    partOfSpeech: "noun",
    frequency: 3,
    acceptedAnswers: ["knytkalas", "knytis", "クニュートカラース", "クニューティス"],
    definition: {
      ja: "参加者がそれぞれ料理を持ち寄って開くパーティー。",
      en: "A party where every guest brings a dish to share.",
    },
    literal: { ja: "包みのパーティー", en: "bundle party" },
    note: {
      ja: "くだけた場面では、ストックホルムのスラングから広まった knytis とも言う。",
      en: "In casual speech it is also called knytis, slang that spread from Stockholm.",
    },
    teaser: {
      ja: "主催者はテーブルを用意するだけ。料理は客と一緒にやってくる",
      en: "The host only sets the table; the food arrives with the guests",
    },
    hints: {
      ja: [
        "人が集まる催しを指す名詞です",
        "友人同士で、それぞれが一品ずつ手料理を持って集まるときに使います",
        "「包み」を意味する語と、「パーティー」を意味する語をつなげた合成語です",
      ],
      en: [
        "A noun for a gathering of people",
        "You use it when friends meet and each brings a home-cooked dish",
        "It is a compound of words meaning \"bundle\" and \"party\"",
      ],
    },
    example: {
      sv: "Vi har knytis på lördag – alla tar med sig en rätt.",
      translations: {
        ja: "土曜にクニューティスをするよ。みんな一品ずつ持ってきてね",
        en: "We're having a potluck on Saturday — everyone brings a dish.",
      },
    },
  },
];

function load(entries: Word[]): readonly Word[] {
  const parsed = entries.map((entry) => wordSchema.parse(entry));
  // id は upsert のキーで、重複すると後の単語が前の単語を上書きする。DB に入れる前に落とす。
  if (new Set(parsed.map((word) => word.id)).size !== parsed.length) {
    throw new Error("単語の id が重複している");
  }

  return Object.freeze(parsed);
}

export const words = load(source);
