/**
 * 英語の UI の文言。この形がそのまま `Messages` の型になり、ほかの言語の辞書は同じ形で書く。
 * 値を取る文言は関数にし、言語ごとに語順や数の書き方を変えられるようにする。
 */
export const en = {
  start: {
    skip: "Skip",
    heading: "A word for a feeling you’ve never named",
    lead: "Somewhere in Swedish it exists. Ask yes-or-no questions to uncover it.",
    startGame: "Start a game",
  },
  header: {
    giveUp: "Give up",
  },
  giveUpDialog: {
    title: "Give up?",
    description: "The word and its meaning will be revealed, and this round ends.",
    cancel: "Cancel",
    confirm: "Give up",
  },
  input: {
    /** 入力欄のラベル。プレースホルダーにも使う */
    label: "Ask a question or guess the word",
    send: "Send",
    remaining: (count: number) => `${count} characters left`,
  },
};
