import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { ApiError } from "../common/api-error.js";
import { clientIpOf, rateLimitSubject } from "./client-ip.js";
import {
  RATE_LIMIT_CLOCK,
  RATE_LIMIT_STORE,
  RATE_LIMIT_WINDOW_MS,
  type RateLimitStore,
  windowStartOf,
} from "./rate-limit-store.js";

/** レートリミットの対象と、1 分あたりの上限。`docs/specifications/api.md`「レートリミット」の表に従う。 */
export const RATE_LIMITS = {
  /** 入力。AI の呼び出しにつながる */
  input: 30,
  /** ゲーム開始。開始のたびに `GameStore` に状態が積まれる */
  start: 10,
} as const;

export type RateLimitTarget = keyof typeof RATE_LIMITS;

const RATE_LIMIT_TARGET = Symbol("RateLimitTarget");

/** ハンドラーをレートリミットの対象にする。`RateLimitGuard` が対象ごとの上限で数える。 */
export const RateLimit = (target: RateLimitTarget) => SetMetadata(RATE_LIMIT_TARGET, target);

/**
 * `@RateLimit` を付けたハンドラーへのリクエストを、対象とクライアントの IP の組ごとに 1 分の窓で数える。
 * 上限を超えたら、窓が終わるまでの秒数を添えて `rate_limited` にする。
 * 本文の検証より先に動くため、形の壊れたリクエストも 1 回と数える。
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(RATE_LIMIT_STORE) private readonly store: RateLimitStore,
    @Inject(RATE_LIMIT_CLOCK) private readonly now: () => number,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const target = this.reflector.get<RateLimitTarget | undefined>(RATE_LIMIT_TARGET, context.getHandler());
    if (!target) return true;

    const now = this.now();
    const windowStart = windowStartOf(now);
    const subject = rateLimitSubject(clientIpOf(context.switchToHttp().getRequest<Request>()));
    const count = await this.store.hit(`${target}:${subject}`, windowStart);
    if (count <= RATE_LIMITS[target]) return true;

    const retryAfterSeconds = Math.max(1, Math.ceil((windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000));
    throw new ApiError("rate_limited", "Too many requests. Please try again later.", retryAfterSeconds);
  }
}
