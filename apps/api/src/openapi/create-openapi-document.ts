import { problemSchema } from "@kotoba/shared";
import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from "@nestjs/swagger";

/**
 * アプリのコントローラーから OpenAPI 仕様を組み立てる。
 * パスとメソッドはコントローラーから、本文と応答の形は引数とデコレーターに付けた zod スキーマから取る。
 */
export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle("Kotoba API")
    .setDescription("ゲームセッション API。仕様は docs/specifications/api.md を参照する。")
    .setVersion("1")
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    // 型付きクライアントの関数名や型名に出るため、コントローラー名を含めずメソッド名だけにする。
    operationIdFactory: (_controllerKey, methodKey) => methodKey,
  });

  // 失敗の応答は `application/problem+json` で `$ref` するため、`Problem` だけは自前で載せる。
  const { definitions } = problemSchema["~standard"].jsonSchema.output({ target: "openapi-3.0" }) as {
    definitions: Record<string, object>;
  };
  document.components = {
    ...document.components,
    schemas: { ...document.components?.schemas, ...definitions },
  };
  return document;
}
