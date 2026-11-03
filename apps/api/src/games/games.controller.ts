import {
  type GameResult,
  type GameStart,
  type Hint,
  type HintRequest,
  type InputResult,
  type PlayerInput,
  gameResultSchema,
  gameStartSchema,
  hintRequestSchema,
  hintSchema,
  inputResultSchema,
  playerInputSchema,
  startGameRequestSchema,
} from "@kotoba/shared";
import { Body, Controller, HttpCode, HttpStatus, Param, Post, UseGuards } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { ApiProblemResponses } from "../openapi/api-problem-responses.decorator.js";
import { RateLimit, RateLimitGuard } from "../rate-limit/rate-limit.guard.js";
import { GamesService } from "./games.service.js";

/** UUID の形でない `gameId` は、ゲームを探す前に `validation_error` にする。 */
const gameIdSchema = z.uuid();

/**
 * ゲームセッション API。`apps/web` の `GameClient` の 4 メソッドと 1 対 1 に対応する。
 * 引数に付けた zod スキーマは、全体のパイプが検証に使い、OpenAPI 仕様の生成が本文とパスの形に使う。
 * `@RateLimit` を付けたハンドラーは、`RateLimitGuard` がクライアントの IP ごとに数える。
 */
@ApiTags("games")
@Controller("games")
@UseGuards(RateLimitGuard)
export class GamesController {
  constructor(private readonly games: GamesService) {}

  @Post()
  @RateLimit("start")
  @ApiCreatedResponse({ description: "ゲームを始めた", standardSchema: gameStartSchema })
  @ApiProblemResponses(
    HttpStatus.BAD_REQUEST,
    HttpStatus.PAYLOAD_TOO_LARGE,
    HttpStatus.TOO_MANY_REQUESTS,
  )
  start(
    @Body({ schema: startGameRequestSchema }) request: z.output<typeof startGameRequestSchema>,
  ): Promise<GameStart> {
    return this.games.start(request);
  }

  @Post(":gameId/inputs")
  @RateLimit("input")
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: "入力を判定した", standardSchema: inputResultSchema })
  @ApiProblemResponses(
    HttpStatus.BAD_REQUEST,
    HttpStatus.NOT_FOUND,
    HttpStatus.CONFLICT,
    HttpStatus.PAYLOAD_TOO_LARGE,
    HttpStatus.TOO_MANY_REQUESTS,
    HttpStatus.SERVICE_UNAVAILABLE,
  )
  input(
    @Param("gameId", { schema: gameIdSchema }) gameId: string,
    @Body({ schema: playerInputSchema }) { text }: PlayerInput,
  ): Promise<InputResult> {
    return this.games.input(gameId, text);
  }

  @Post(":gameId/hints")
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: "ヒントを開示した", standardSchema: hintSchema })
  @ApiProblemResponses(
    HttpStatus.BAD_REQUEST,
    HttpStatus.NOT_FOUND,
    HttpStatus.CONFLICT,
    HttpStatus.PAYLOAD_TOO_LARGE,
  )
  revealHint(
    @Param("gameId", { schema: gameIdSchema }) gameId: string,
    @Body({ schema: hintRequestSchema }) { index }: HintRequest,
  ): Promise<Hint> {
    return this.games.revealHint(gameId, index);
  }

  @Post(":gameId/give-up")
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: "ギブアップを確定した", standardSchema: gameResultSchema })
  @ApiProblemResponses(HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND)
  giveUp(@Param("gameId", { schema: gameIdSchema }) gameId: string): Promise<GameResult> {
    return this.games.giveUp(gameId);
  }
}
