import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { PrismaRateLimitStore } from "./prisma-rate-limit-store.js";
import { RATE_LIMIT_CLOCK, RATE_LIMIT_STORE } from "./rate-limit-store.js";
import { RateLimitGuard } from "./rate-limit.guard.js";

@Module({
  // カウンタは進行中ゲームと同じ PostgreSQL に置く。テストではメモリ内の実装に差し替える。
  providers: [
    RateLimitGuard,
    {
      provide: RATE_LIMIT_STORE,
      useFactory: (prisma: PrismaService) => new PrismaRateLimitStore(prisma),
      inject: [PrismaService],
    },
    { provide: RATE_LIMIT_CLOCK, useValue: () => Date.now() },
  ],
  exports: [RateLimitGuard, RATE_LIMIT_STORE, RATE_LIMIT_CLOCK],
})
export class RateLimitModule {}
