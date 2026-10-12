import { Injectable, type PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";
import { ApiError } from "./api-error.js";

/**
 * `packages/shared` の zod スキーマで本文やパスの値を検証し、変換後の値を渡す。
 * 合わなければ `validation_error` にする。どこが合わないかは、入力した本人が送った値の範囲なので `detail` に載せる。
 */
@Injectable()
export class ZodValidationPipe<T extends ZodType> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;

    const detail = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new ApiError("validation_error", detail);
  }
}
