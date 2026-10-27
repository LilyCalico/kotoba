import { randomUUID } from "node:crypto";
import {
  type GameResult,
  type GameStart,
  type Hint,
  type InputResult,
  type Language,
  MAX_HINTS,
  type UiLocale,
  type Word,
  gameResultOf,
} from "@kotoba/shared";
import { Inject, Injectable } from "@nestjs/common";
import { ApiError } from "../common/api-error.js";
import { WordsService } from "../words/words.service.js";
import { classifyInput } from "./classify-input.js";
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
  ) {}

  async start({
    language,
    locale,
    excludeWordIds,
  }: {
    language: Language;
    locale: UiLocale;
    excludeWordIds: readonly string[];
  }): Promise<GameStart> {
    const word = await this.words.pick({ language, excludeWordIds });
    if (!word) throw new ApiError("validation_error", `No words are available for "${language}".`);

    const game: Game = { id: randomUUID(), wordId: word.id, locale, hintsRevealed: 0, history: [] };
    await this.store.create(game);
    return { gameId: game.id, language: word.language, teaser: word.teaser[locale] };
  }

  /**
   * 入力を判定し、Q&A 履歴に積む。正解ならゲームを終える。
   * クリア済みのゲームにはクリア時の結果を返し直し、ギブアップ済みのゲームは `game_finished` にする。
   */
  async input(gameId: string, text: string): Promise<InputResult> {
    const game = await this.load(gameId);
    if (game.result) {
      if (game.result.outcome === "gave_up") throw new ApiError("game_finished");
      return { kind: "answer", correct: true, result: game.result };
    }

    const word = await this.wordOf(game);
    const classified = classifyInput(word, text);
    const result: InputResult =
      classified.kind === "answer" && classified.correct
        ? { ...classified, result: gameResultOf(word, "cleared", game.locale) }
        : classified;

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
