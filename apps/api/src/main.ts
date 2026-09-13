import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

/**
 * Vercel Services はオリジナルのリクエストパスをそのままサービスへ渡すため、
 * 公開ルーティングで api に向けている `/api/v1` を Nest 側の接頭辞として受ける。
 */
const GLOBAL_PREFIX = "api/v1";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(GLOBAL_PREFIX);
  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
