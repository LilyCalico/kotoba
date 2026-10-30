import { Module } from "@nestjs/common";
import { JudgeModule } from "../judge/judge.module.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { WordsModule } from "../words/words.module.js";
import { GAME_STORE } from "./game-store.js";
import { GamesController } from "./games.controller.js";
import { GamesService } from "./games.service.js";
import { PrismaGameStore } from "./prisma-game-store.js";

@Module({
  imports: [WordsModule, JudgeModule],
  controllers: [GamesController],
  // 保存先を差し替えるときは、ここで渡す実装だけを入れ替える（ADR 0003）。
  providers: [
    GamesService,
    {
      provide: GAME_STORE,
      useFactory: (prisma: PrismaService) => new PrismaGameStore(prisma),
      inject: [PrismaService],
    },
  ],
})
export class GamesModule {}
