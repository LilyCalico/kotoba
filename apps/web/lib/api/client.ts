import createClient, { type ClientOptions } from "openapi-fetch";

import type { components, paths } from "./schema";

/** `apps/api` の OpenAPI 仕様にある名前付きスキーマ。 */
export type ApiSchemas = components["schemas"];

/**
 * `apps/api` を叩く型付きクライアント。パス・メソッド・本文・応答の型は、`./schema` が持つ OpenAPI 仕様の型から付く。
 * web と api は同一ホストに載るため、既定では `baseUrl` を付けず `/api/v1/...` の相対パスで呼ぶ。
 */
export function createApiClient(options: ClientOptions = {}) {
  return createClient<paths>(options);
}

export type ApiClient = ReturnType<typeof createApiClient>;
