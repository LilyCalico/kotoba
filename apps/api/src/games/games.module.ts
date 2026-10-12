import { Module } from "@nestjs/common";
import { WordsModule } from "../words/words.module.js";
import { GAME_STORE } from "./game-store.js";
import { GamesController } from "./games.controller.js";
import { GamesService } from "./games.service.js";
import { MemoryGameStore } from "./memory-game-store.js";

@Module({
  imports: [WordsModule],
  controllers: [GamesController],
  // 保存先を差し替えるときは、ここで渡す実装だけを入れ替える（ADR 0003）。
  providers: [GamesService, { provide: GAME_STORE, useFactory: () => new MemoryGameStore() }],
})
export class GamesModule {}
