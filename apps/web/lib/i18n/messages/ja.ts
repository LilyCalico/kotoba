/**
 * 日本語の UI の文言。英語の辞書（`en.ts`）と同じ形で書き、キーの意味はそちらのコメントに従う。
 * 日本語の UI では意味当てで遊ぶため、遊び方の説明・入力欄・正誤のフィードバックは「意味を当てる」前提で書く。
 * 口調は砕けているけれど優しいトーンにし、回答のピルのように一目で読ませる文言は短く保つ。
 * E2E からも読み込むため、ほかのモジュールを読み込まない。
 */
/** 数と単位（「1 分」）の間に置く、改行しない空白。数と単位が行をまたいで分かれないようにする。 */
const NBSP = "\u00a0";

export const ja = {
  metadata: {
    description:
      "スウェーデン語の言葉を見て、はい・いいえで答えられる質問をしながら、その意味を探し当てるゲーム。",
    playTitle: "プレイ",
  },
  start: {
    skip: "スキップ",
    heading: "その言葉が名づけた気持ちは？",
    lead: "スウェーデン語の言葉がひとつ出てくるよ。はい・いいえで答えられる質問をして、その意味を当ててみよう。",
    startGame: "ゲームをはじめる",
  },
  header: {
    giveUp: "ギブアップ",
  },
  giveUpDialog: {
    title: "ギブアップする？",
    description: "答えの意味が出て、このゲームはおしまいになるよ。",
    cancel: "やめておく",
    confirm: "ギブアップ",
  },
  input: {
    label: "質問するか、意味を答えてみて",
    send: "送信",
    remaining: (count: number) => `あと ${count}${NBSP}文字`,
  },
  play: {
    teaserInstruction: "Enter か Space を押すと、質問をはじめられるよ。",
    skipToInput: "入力欄へ移動",
    playAgain: "もう一度遊ぶ",
    startFailed: "ゲームをはじめられなかったよ。",
    startLimit: (retryAfterSeconds: number | undefined) =>
      `新しいゲームが続きすぎたみたい。${waitPhrase(retryAfterSeconds)}、もう一度試してね。`,
    retry: "もう一度",
    giveUpFailed: "ギブアップできなかったよ。もう一度試してね。",
  },
  teaser: {
    title: "お題",
  },
  wordCard: {
    title: "ことば",
    prompt: "この言葉、どういう意味？",
  },
  verdict: {
    yes: "はい",
    no: "いいえ",
    unclear: "なんとも言えないな",
    irrelevant: "それは関係ないかな",
    not_a_question: "はい・いいえで聞いてみて",
  },
  unsupportedLanguage: "日本語・英語・スウェーデン語で聞いてね。",
  answerFeedback: {
    correct: "正解、その意味だよ！",
    incorrect: "惜しい、その意味じゃないみたい。",
  },
  pending: {
    title: "考え中…",
    slow: "ごめん、ちょっと考えさせて。いつもより時間がかかってるみたい。",
  },
  error: {
    generic: "うまくいかなかったみたい。もう一度送ってみて。",
    aiUnavailable: "ごめん、無料の AI がつまずいたみたい。もう一度送ってみて。何回か送れば、たいてい通るよ。",
    aiLimit: (retryAfterSeconds: number | undefined) =>
      `無料の AI の上限に届いちゃった。${waitPhrase(retryAfterSeconds)}、もう一度送ってみて。`,
    rateLimit: (retryAfterSeconds: number | undefined) =>
      `ちょっと送るのが速すぎるみたい。${waitPhrase(retryAfterSeconds)}、もう一度送ってみて。`,
    expired: "このゲームは時間切れになったよ。新しいゲームをはじめてね。",
  },
  hint: {
    button: "ヒントを見る",
    buttonLabel: (remaining: number) => `ヒントを見る（残り ${remaining}${NBSP}回）`,
    title: (index: number, total: number) => `ヒント ${index} / ${total}`,
  },
  result: {
    heading: {
      cleared: "見つけたね！",
      gave_up: "この言葉の意味は",
    },
    partOfSpeech: {
      noun: "名詞",
      verb: "動詞",
      adjective: "形容詞",
      phrase: "言い回し",
    },
    literal: (literal: string) => `直訳すると「${literal}」`,
  },
  common: {
    close: "閉じる",
  },
};

/**
 * 待つ時間を「N 分くらいしたら」の形にし、文の頭に置く。1 時間未満は分に切り上げ、それ以上は時間に丸める。
 * 秒数がなければ、時間を言わずに「少ししたら」にする。
 */
function waitPhrase(seconds: number | undefined): string {
  if (seconds === undefined) return "少ししたら";
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  if (minutes < 60) return `${minutes}${NBSP}分くらいしたら`;
  const hours = Math.max(1, Math.round(seconds / 3600));
  return `${hours}${NBSP}時間くらいしたら`;
}
