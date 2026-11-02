import { Injectable, type OnModuleDestroy } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

/**
 * アプリ全体で 1 つだけ持つ PrismaClient。インスタンスごとに接続プールを抱えるため、
 * 各所で new せず、このプロバイダーを注入して使う。
 *
 * 接続は最初のクエリで張る。起動時に接続しないので、DB を使わないテストは DB なしで動く。
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
