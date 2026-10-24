import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module.js";
import { WordsModule } from "./words/words.module.js";

@Module({
  imports: [PrismaModule, WordsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
