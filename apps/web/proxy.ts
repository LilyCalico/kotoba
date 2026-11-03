import { type NextRequest, NextResponse } from "next/server";

import { localeOfPath, localizedPath, negotiateLocale } from "@/lib/i18n/locale";

/**
 * 言語のない URL（`/`・`/play`）を、Accept-Language で選んだ言語の URL（`/ja`・`/en/play`）へリダイレクトする。
 * 言語の付いた URL はそのまま通す。
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (localeOfPath(pathname)) return;

  const url = request.nextUrl.clone();
  url.pathname = localizedPath(negotiateLocale(request.headers.get("accept-language")), pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Proxy は next.config.ts の rewrites より先に動く。api への中継（/api/v1）を対象から外さないと、
  // ローカルで api へのリクエストまでリダイレクトされる。拡張子のあるパス（icon.svg など）と
  // Next.js・Vercel の内部のパスも外す。
  matcher: ["/((?!api/|_next/|_vercel/|.*\\.[^/]+$).*)"],
};
