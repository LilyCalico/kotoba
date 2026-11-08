/**
 * 英語の UI の文言。この形がそのまま `Messages` の型になり、ほかの言語の辞書は同じ形で書く。
 * 値を取る文言は関数にし、言語ごとに語順や数の書き方を変えられるようにする。
 * 遊び方で変わる文言は、`GameMode` の値（`guess_word`・`guess_meaning`）をキーにして、どの言語でも両方の遊び方を持つ。
 * E2E からも読み込むため、ほかのモジュールを読み込まない。
 */
export const en = {
  /** ページの説明と、サイト名の前に付ける各ページのタイトル */
  metadata: {
    description: {
      guess_word: "Ask yes-or-no questions to uncover a Swedish word for a feeling you've never been able to name.",
      guess_meaning: "See a Swedish word and ask yes-or-no questions to uncover what it means.",
    },
    playTitle: "Play",
  },
  start: {
    skip: "Skip",
    heading: {
      guess_word: "A word for a feeling you’ve never named",
      guess_meaning: "What feeling does this word name?",
    },
    lead: {
      guess_word: "Somewhere in Swedish it exists. Ask yes-or-no questions to uncover it.",
      guess_meaning: "You'll get a Swedish word. Ask yes-or-no questions and guess what it means.",
    },
    startGame: "Start a game",
  },
  header: {
    giveUp: "Give up",
  },
  giveUpDialog: {
    title: "Give up?",
    description: {
      guess_word: "The word and its meaning will be revealed, and this round ends.",
      guess_meaning: "The meaning will be revealed, and this round ends.",
    },
    cancel: "Cancel",
    confirm: "Give up",
  },
  input: {
    /** 入力欄のラベル。プレースホルダーにも使う */
    label: {
      guess_word: "Ask a question or guess the word",
      guess_meaning: "Ask a question or guess the meaning",
    },
    send: "Send",
    remaining: (count: number) => `${count} characters left`,
  },
  play: {
    /** 設問の提示で読み上げる、チャットへ進む操作の案内 */
    teaserInstruction: "Press Enter or Space to start asking questions.",
    skipToInput: "Skip to the input",
    playAgain: "Play again",
    startFailed: "Couldn't start a game.",
    /** ゲーム開始がレートリミットを超えたときの案内 */
    startLimit: (retryAfterSeconds: number | undefined) =>
      `Too many new games. Try again ${waitPhrase(retryAfterSeconds)}.`,
    retry: "Retry",
    giveUpFailed: "Couldn't give up. Please try again.",
  },
  teaser: {
    title: "Question",
  },
  /** 意味当てで最初に見せる、単語と読みのカード */
  wordCard: {
    title: "Word",
    prompt: "What does this word mean?",
  },
  /** 質問への 5 値の回答。`Verdict` の値で引く */
  verdict: {
    yes: "Yes",
    no: "No",
    unclear: "Hard to say",
    irrelevant: "That's not related",
    not_a_question: "Try a yes-or-no question",
  },
  unsupportedLanguage: "Please ask in Japanese, English, or Swedish.",
  answerFeedback: {
    correct: {
      guess_word: "That's the word!",
      guess_meaning: "That's the meaning!",
    },
    incorrect: {
      guess_word: "Not the word this time.",
      guess_meaning: "Not quite the meaning.",
    },
  },
  pending: {
    title: "Thinking…",
    /** 応答待ちが長引いたときに添える詫び */
    slow: "Sorry, give me a moment to think — this is taking a little longer than usual.",
  },
  error: {
    generic: "Something went wrong. Please send it again.",
    aiUnavailable: "Sorry, the free AI plan hiccupped. Please send it again — a few tries usually does it.",
    /** 無料枠の AI が上限に達したときの案内 */
    aiLimit: (retryAfterSeconds: number | undefined) =>
      `The free AI plan hit its limit. Please try again ${waitPhrase(retryAfterSeconds)}.`,
    /** 入力がレートリミットを超えたときの案内 */
    rateLimit: (retryAfterSeconds: number | undefined) =>
      `You're sending too fast. Please try again ${waitPhrase(retryAfterSeconds)}.`,
    expired: "This game has expired. Start a new one.",
  },
  hint: {
    button: "Show a hint",
    /** ヒントボタンの名前。残りの回数を含め、支援技術にも数が伝わるようにする */
    buttonLabel: (remaining: number) => `Show a hint, ${remaining} left`,
    title: (index: number, total: number) => `Hint ${index} of ${total}`,
  },
  result: {
    /** 結果のウィンドウの見出し。`Outcome` の値と遊び方で引く */
    heading: {
      cleared: {
        guess_word: "You found it",
        guess_meaning: "You found it",
      },
      gave_up: {
        guess_word: "The word was",
        guess_meaning: "This word means",
      },
    },
    /** 品詞のラベル。`PartOfSpeech` の値で引く */
    partOfSpeech: {
      noun: "noun",
      verb: "verb",
      adjective: "adjective",
      phrase: "phrase",
    },
    literal: (literal: string) => `Literally “${literal}”`,
  },
  common: {
    close: "Close",
  },
};

/**
 * 待つ時間を「in about N minutes」の形にする。1 時間未満は分に切り上げ、それ以上は時間に丸める。
 * 秒数がなければ、時間を言わずに「in a little while」にする。
 */
function waitPhrase(seconds: number | undefined): string {
  if (seconds === undefined) return "in a little while";
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  if (minutes === 1) return "in about a minute";
  if (minutes < 60) return `in about ${minutes} minutes`;
  const hours = Math.max(1, Math.round(seconds / 3600));
  return hours === 1 ? "in about an hour" : `in about ${hours} hours`;
}
