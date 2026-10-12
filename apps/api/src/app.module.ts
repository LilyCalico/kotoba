import { Module } from "@nestjs/common";
import { GamesModule } from "./games/games.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { WordsModule } from "./words/words.module.js";

@Module({
  imports: [PrismaModule, WordsModule, GamesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
