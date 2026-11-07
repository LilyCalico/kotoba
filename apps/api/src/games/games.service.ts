import { randomUUID } from "node:crypto";
import {
  type GameMode,
  type GameResult,
  type GameStart,
  type Hint,
  type InputResult,
  type Language,
  MAX_HINTS,
  type UiLocale,
  type Word,
  gameResultOf,
  isAcceptedAnswer,
} from "@kotoba/shared";
import { Inject, Injectable } from "@nestjs/common";
import { ApiError } from "../common/api-error.js";
import { INPUT_JUDGE, type InputJudge } from "../judge/input-judge.js";
import { WordsService } from "../words/words.service.js";
import { GAME_STORE, type Game, type GameStore } from "./game-store.js";

/**
 * ゲーム 1 周の進行を担う。秘密の単語と Q&A 履歴は `GameStore` に置き、応答には
 * ゲームが終わるまで単語・単語の id・定義・未開示のヒントを載せない。
 */
@Injectable()
export class GamesService {
  constructor(
    private readonly words: WordsService,
    @Inject(GAME_STORE) private readonly store: GameStore,
    @Inject(INPUT_JUDGE) private readonly judge: InputJudge,
  ) {}

  async start({
    language,
    locale,
    mode,
    excludeWordIds,
  }: {
    language: Language;
    locale: UiLocale;
    mode: GameMode;
    excludeWordIds: readonly string[];
  }): Promise<GameStart> {
    const word = await this.words.pick({ language, excludeWordIds });
    if (!word) throw new ApiError("validation_error", `No words are available for "${language}".`);

    const game: Game = { id: randomUUID(), wordId: word.id, locale, mode, hintsRevealed: 0, history: [] };
    await this.store.create(game);
    return mode === "guess_meaning"
      ? { gameId: game.id, language: word.language, mode, word: word.word, reading: word.reading }
      : { gameId: game.id, language: word.language, mode, teaser: word.teaser[locale] };
  }

  /**
   * 入力を判定し、Q&A 履歴に積む。正解ならゲームを終える。
   * クリア済みのゲームにはクリア時の結果を返し直し、ギブアップ済みのゲームは `game_finished` にする。
   * 判定に失敗した入力（`ai_unavailable` など）は履歴に積まない。
   */
  async input(gameId: string, text: string): Promise<InputResult> {
    const game = await this.load(gameId);
    if (game.result) {
      if (game.result.outcome === "gave_up") throw new ApiError("game_finished");
      return { kind: "answer", correct: true, result: game.result };
    }

    const word = await this.wordOf(game);
    const result = await this.classify(game, word, text);

    game.history.push({ text, result });
    if (result.kind === "answer" && result.result) game.result = result.result;
    await this.store.save(game);
    return result;
  }

  /**
   * `index` 番目のヒントを返す。開示済みの番号には同じヒントを返し、数を進めない。
   * 番号を送らせるのは、応答を受け取り損ねた再送で次のヒントが開示されないようにするためである。
   */
  async revealHint(gameId: string, index: number): Promise<Hint> {
    const game = await this.load(gameId);
    if (game.result) throw new ApiError("game_finished");
    if (index > MAX_HINTS) throw new ApiError("hint_limit_reached");
    if (index > game.hintsRevealed + 1) throw new ApiError("hint_out_of_order");

    const word = await this.wordOf(game);
    if (index > game.hintsRevealed) {
      game.hintsRevealed = index;
      await this.store.save(game);
    }
    return { index, text: word.hints[game.locale][index - 1] };
  }

  /** ギブアップを確定して正解を返す。終了済みのゲームには、終了時の結果をそのまま返す。 */
  async giveUp(gameId: string): Promise<GameResult> {
    const game = await this.load(gameId);
    if (game.result) return game.result;

    const word = await this.wordOf(game);
    game.result = gameResultOf(word, "gave_up", game.locale);
    await this.store.save(game);
    return game.result;
  }

  /**
   * 入力を判定する。コードの正規化マッチで正解なら、AI を呼ばずにクリアにする。
   * 外れた入力だけを AI に回し、質問か解答か対応外の言語かを分類させる。
   * 解答と分類した入力は、AI がスペルミス・音写ゆれとして救えば正解、救わなければ誤答にする。
   * 救った正解も、正規化マッチの正解と同じ応答にする。
   */
  private async classify(game: Game, word: Word, text: string): Promise<InputResult> {
    const cleared = (): InputResult => ({
      kind: "answer",
      correct: true,
      result: gameResultOf(word, "cleared", game.locale),
    });
    if (isAcceptedAnswer(word, text)) return cleared();

    const judgement = await this.judge.judge({ word, history: game.history, text });
    switch (judgement.kind) {
      case "question":
        return { kind: "question", verdict: judgement.verdict };
      case "answer":
        return judgement.correct ? cleared() : { kind: "answer", correct: false };
      case "unsupported_language":
        return { kind: "unsupported_language" };
    }
  }

  private async load(gameId: string): Promise<Game> {
    const game = await this.store.get(gameId);
    if (!game) throw new ApiError("game_not_found", "The game does not exist or has expired.");
    return game;
  }

  /** ゲーム中に単語が DB から消えるか壊れると、続けられない。 */
  private async wordOf(game: Game): Promise<Word> {
    const word = await this.words.findById(game.wordId);
    if (!word) throw new Error(`Word ${game.wordId} of game ${game.id} is missing.`);
    return word;
  }
}
