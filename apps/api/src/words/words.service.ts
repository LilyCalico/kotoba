import { type Language, type Word, wordSchema } from "@kotoba/shared";
import { Injectable, Logger, type OnApplicationBootstrap } from "@nestjs/common";
import type { Word as WordRow } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { pickWeighted } from "./words.js";

/**
 * 出題する単語を DB から引く。
 * 単語の追加・修正をデプロイなしで反映させるため、結果をキャッシュせず毎回引く。
 * `wordSchema` を通らない行は候補から外してログに残し、残りの単語でゲームを続ける。
 */
@Injectable()
export class WordsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(WordsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 起動時に全件を検証し、不正な行をログに出す。
   * 起動を待たせず、DB に届かなくても起動を止めない。接続先がなければ何もしない（DB を使わないテスト）。
   */
  onApplicationBootstrap(): void {
    if (!process.env.DATABASE_URL) return;

    void this.prisma.word
      .findMany({ orderBy: { id: "asc" } })
      .then((rows) => this.parseAll(rows))
      .catch((error: unknown) => {
        this.logger.warn(`単語の検証で DB に接続できなかった: ${String(error)}`);
      });
  }

  async findById(id: string): Promise<Word | undefined> {
    const row = await this.prisma.word.findUnique({ where: { id } });
    return row ? this.parse(row) : undefined;
  }

  /**
   * ゲーム開始時の 1 語を選ぶ。対象言語の単語から `excludeWordIds` を除き、`frequency` を重みに選ぶ。
   * 除いた結果が空ならプール全体から選ぶ。対象言語の単語が 1 つもなければ何も返さない。
   */
  async pick({
    language,
    excludeWordIds = [],
  }: {
    language: Language;
    excludeWordIds?: readonly string[];
  }): Promise<Word | undefined> {
    const rows = await this.prisma.word.findMany({ where: { language }, orderBy: { id: "asc" } });
    const pool = this.parseAll(rows);
    const excluded = new Set(excludeWordIds);
    const candidates = pool.filter((word) => !excluded.has(word.id));

    return pickWeighted(candidates.length > 0 ? candidates : pool);
  }

  private parseAll(rows: readonly WordRow[]): Word[] {
    return rows.flatMap((row) => this.parse(row) ?? []);
  }

  private parse(row: WordRow): Word | undefined {
    const result = wordSchema.safeParse(toWordInput(row));
    if (result.success) return result.data;

    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    this.logger.error(`単語 ${row.id} が wordSchema を満たさない（${issues}）`);
    return undefined;
  }
}

/**
 * DB の行を `wordSchema` に渡せる形にする。
 * 時刻の列は `Word` にないので落とし、任意の項目の NULL は省略に戻す。
 */
export function toWordInput({
  createdAt: _createdAt,
  updatedAt: _updatedAt,
  literal,
  note,
  example,
  ...fields
}: WordRow): unknown {
  return {
    ...fields,
    ...(literal === null ? {} : { literal }),
    ...(note === null ? {} : { note }),
    ...(example === null ? {} : { example }),
  };
}
