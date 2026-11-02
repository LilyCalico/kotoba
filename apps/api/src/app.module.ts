import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GamesModule } from "./games/games.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { WordsModule } from "./words/words.module.js";

@Module({
  imports: [
    // 環境変数は起動時に Node.js の `--env-file-if-exists` で読み込み済み。ここでは `process.env` だけを見る。
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
    PrismaModule,
    WordsModule,
    GamesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
