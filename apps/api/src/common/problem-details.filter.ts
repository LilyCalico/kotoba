import { STATUS_CODES } from "node:http";
import type { ErrorCode, Problem } from "@kotoba/shared";
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";
import { ApiError } from "./api-error.js";

/**
 * すべての失敗を RFC 9457 の Problem Details（`code` 付き）で返す。
 * コントローラーに届く前の失敗（ルートなし・本文の大きさ超過・壊れた JSON）もここを通る。
 */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const { status, code, detail } = this.describe(exception);
    const problem: Problem = {
      type: "about:blank",
      title: STATUS_CODES[status] ?? "Error",
      status,
      code,
      ...(detail === undefined ? {} : { detail }),
    };

    const response = host.switchToHttp().getResponse<Response>();
    if (exception instanceof ApiError && exception.retryAfterSeconds !== undefined) {
      response.setHeader("Retry-After", String(exception.retryAfterSeconds));
    }
    response
      .status(status)
      .type("application/problem+json")
      .json(problem);
  }

  private describe(exception: unknown): { status: number; code: ErrorCode; detail?: string } {
    if (exception instanceof ApiError) {
      return { status: exception.status, code: exception.code, detail: exception.detail };
    }

    const status = statusOf(exception);
    if (status !== undefined) {
      switch (status) {
        // express の body-parser が投げる、壊れた JSON と大きすぎる本文。
        case HttpStatus.BAD_REQUEST:
        case HttpStatus.PAYLOAD_TOO_LARGE:
          return { status, code: "validation_error" };
        // 正しく作られたクライアントからは起きないため、専用の code を設けない。
        case HttpStatus.NOT_FOUND:
        case HttpStatus.METHOD_NOT_ALLOWED:
          return { status, code: "internal_error" };
      }
    }

    this.logger.error(exception instanceof Error ? (exception.stack ?? exception.message) : exception);
    return { status: HttpStatus.INTERNAL_SERVER_ERROR, code: "internal_error" };
  }
}

/**
 * HTTP の失敗として扱える例外のステータス。
 * express の body-parser は `HttpException` ではなく、`status` と `expose: true` を持つエラー（http-errors）を投げる。
 */
function statusOf(exception: unknown): number | undefined {
  if (exception instanceof HttpException) return exception.getStatus();
  if (
    exception instanceof Error &&
    "expose" in exception &&
    exception.expose === true &&
    "status" in exception &&
    typeof exception.status === "number"
  ) {
    return exception.status;
  }
  return undefined;
}
