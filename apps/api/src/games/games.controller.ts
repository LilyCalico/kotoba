import {
  type GameResult,
  type GameStart,
  type Hint,
  type HintRequest,
  type InputResult,
  type PlayerInput,
  hintRequestSchema,
  playerInputSchema,
  startGameRequestSchema,
} from "@kotoba/shared";
import { Body, Controller, HttpCode, HttpStatus, Param, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { GamesService } from "./games.service.js";

/** UUID の形でない `gameId` は、ゲームを探す前に `validation_error` にする。 */
const gameIdPipe = new ZodValidationPipe(z.uuid());

/** ゲームセッション API。`apps/web` の `GameClient` の 4 メソッドと 1 対 1 に対応する。 */
@Controller("games")
export class GamesController {
  constructor(private readonly games: GamesService) {}

  @Post()
  start(
    @Body(new ZodValidationPipe(startGameRequestSchema))
    request: z.output<typeof startGameRequestSchema>,
  ): Promise<GameStart> {
    return this.games.start(request);
  }

  @Post(":gameId/inputs")
  @HttpCode(HttpStatus.OK)
  input(
    @Param("gameId", gameIdPipe) gameId: string,
    @Body(new ZodValidationPipe(playerInputSchema)) { text }: PlayerInput,
  ): Promise<InputResult> {
    return this.games.input(gameId, text);
  }

  @Post(":gameId/hints")
  @HttpCode(HttpStatus.OK)
  revealHint(
    @Param("gameId", gameIdPipe) gameId: string,
    @Body(new ZodValidationPipe(hintRequestSchema)) { index }: HintRequest,
  ): Promise<Hint> {
    return this.games.revealHint(gameId, index);
  }

  @Post(":gameId/give-up")
  @HttpCode(HttpStatus.OK)
  giveUp(@Param("gameId", gameIdPipe) gameId: string): Promise<GameResult> {
    return this.games.giveUp(gameId);
  }
}
