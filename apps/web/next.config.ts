import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

/** `pnpm dev` で api が待ち受ける起点。`apps/api` の既定のポートに合わせる。 */
const DEV_API_ORIGIN = "http://localhost:3001";

/**
 * `/api/v1/*` を中継する api サービスの起点。
 *
 * 本番では Vercel Services が `/api/v1/(.*)` を api サービスへ直接振り分けるため、リクエストは Next.js に届かない。
 * 中継はローカル開発と E2E のためだけに置き、次のとおり決める。
 *
 * - `API_PROXY_ORIGIN` があればその値
 * - 開発サーバー（`next dev`）なら `DEV_API_ORIGIN`
 * - それ以外（`next build` など）は中継しない
 */
function apiProxyOrigin(phase: string): string | undefined {
  if (process.env.API_PROXY_ORIGIN) return process.env.API_PROXY_ORIGIN;
  return phase === PHASE_DEVELOPMENT_SERVER ? DEV_API_ORIGIN : undefined;
}

export default function config(phase: string): NextConfig {
  const origin = apiProxyOrigin(phase);

  return {
    reactCompiler: true,
    async rewrites() {
      if (!origin) {
        return [];
      }

      return [
        {
          source: "/api/v1/:path*",
          destination: `${origin}/api/v1/:path*`,
        },
      ];
    },
  };
}
