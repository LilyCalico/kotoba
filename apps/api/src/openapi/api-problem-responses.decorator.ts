import { STATUS_CODES } from "node:http";
import { HttpStatus, applyDecorators } from "@nestjs/common";
import { ApiResponse } from "@nestjs/swagger";

/** 失敗の本文の型。`createOpenApiDocument` が `problemSchema` から `components.schemas` に載せる。 */
export const PROBLEM_SCHEMA_REF = "#/components/schemas/Problem";

/**
 * エンドポイントが返し得る失敗のステータスを、Problem Details（`application/problem+json`）の応答として仕様に載せる。
 * 想定外の例外による 500 はどのエンドポイントでも起こり得るため、常に足す。
 */
export function ApiProblemResponses(...statuses: HttpStatus[]): MethodDecorator & ClassDecorator {
  return applyDecorators(
    ...[...statuses, HttpStatus.INTERNAL_SERVER_ERROR].map((status) =>
      ApiResponse({
        status,
        description: STATUS_CODES[status] ?? String(status),
        content: { "application/problem+json": { schema: { $ref: PROBLEM_SCHEMA_REF } } },
      }),
    ),
  );
}
