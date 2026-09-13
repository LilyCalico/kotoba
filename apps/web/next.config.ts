import type { NextConfig } from "next";

/**
 * api サービスの起点。ローカル開発と E2E でのみ指定する。
 *
 * 本番では Vercel Services が `/api/v1/(.*)` を api サービスへ直接振り分けるため、
 * リクエストは Next.js に届かない。この変数を未設定のままにして中継を無効化する。
 */
const apiProxyOrigin = process.env.API_PROXY_ORIGIN;

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    if (!apiProxyOrigin) {
      return [];
    }

    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiProxyOrigin}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
