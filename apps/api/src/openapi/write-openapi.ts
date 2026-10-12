import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module.js";
import { configureApp } from "../configure-app.js";
import { createOpenApiDocument } from "./create-openapi-document.js";

/**
 * OpenAPI 仕様を JSON に書き出す。`pnpm --filter @kotoba/api openapi` から、ビルド後の dist で動かす。
 * tsx などの esbuild 系の実行では `emitDecoratorMetadata` が出ず、引数の型を読めないためである。
 *
 * アプリは組み立てるだけで、起動も DB への接続もしない。
 */
async function main(): Promise<void> {
  const output = resolve(process.argv[2] ?? "openapi.json");
  const app = await NestFactory.create(AppModule, { logger: ["error", "warn"] });
  configureApp(app);

  const document = createOpenApiDocument(app);
  await writeFile(output, `${JSON.stringify(document, null, 2)}\n`);
  await app.close();
}

await main();
