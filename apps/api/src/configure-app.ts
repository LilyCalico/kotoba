import { type INestApplication, StandardSchemaValidationPipe } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "./common/api-error.js";
import { ProblemDetailsFilter } from "./common/problem-details.filter.js";

/**
 * Vercel Services はオリジナルのリクエストパスをそのままサービスへ渡すため、
 * 公開ルーティングで api に向けている `/api/v1` を Nest 側の接頭辞として受ける。
 * 先頭の `/` は省かない。Express のアダプターは接頭辞をそのままマウント先に使うため、
 * `/` がないと存在しないルートの 404 が Nest の例外フィルターを通らず、Express の HTML で返る。
 */
export const GLOBAL_PREFIX = "/api/v1";

/**
 * 起動とテストで共通のアプリの設定。HTTP の振る舞いを揃えるため、テストもこれを通して組み立てる。
 */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix(GLOBAL_PREFIX);
  // ゲームの応答は呼び出しごとに変わる。成功も失敗も、ブラウザや CDN に残さない。
  app.use((_request: Request, response: Response, next: NextFunction) => {
    response.setHeader("Cache-Control", "no-store");
    next();
  });
  // `@Body({ schema })` などで引数に付けた zod スキーマで検証し、変換後の値を渡す。
  // 合わなければ `validation_error`。どこが合わないかは、入力した本人が送った値の範囲なので `detail` に載せる。
  app.useGlobalPipes(
    new StandardSchemaValidationPipe({
      exceptionFactory: (issues) =>
        new ApiError(
          "validation_error",
          issues
            .map(({ path, message }) => `${formatPath(path)}: ${message}`)
            .join("; "),
        ),
    }),
  );
  app.useGlobalFilters(new ProblemDetailsFilter());
}

/** Standard Schema の issue の位置を `a.b.0` の形にする。要素はキーそのものか `{ key }` のどちらか。 */
function formatPath(path: ReadonlyArray<PropertyKey | { key: PropertyKey }> | undefined): string {
  if (!path?.length) return "(root)";
  return path.map((segment) => String(typeof segment === "object" ? segment.key : segment)).join(".");
}
