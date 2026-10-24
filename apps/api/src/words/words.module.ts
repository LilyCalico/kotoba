import { Module } from "@nestjs/common";
import { WordsService } from "./words.service.js";

@Module({
  providers: [WordsService],
  exports: [WordsService],
})
export class WordsModule {}
