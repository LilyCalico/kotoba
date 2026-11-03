import { type UiLocale, uiLocaleSchema } from "@kotoba/shared";

/** UI 言語。URL の先頭のセグメント（`/ja`・`/en`）で決まる。 */
export const LOCALES: readonly UiLocale[] = uiLocaleSchema.options;

/** ブラウザの言語がどの UI 言語にも当たらないときの言語。api の `locale` の既定と揃える。 */
export const DEFAULT_LOCALE: UiLocale = "en";

export function isLocale(value: string): value is UiLocale {
  return (LOCALES as readonly string[]).includes(value);
}

/** パスの先頭のセグメントが UI 言語なら、その言語を返す。 */
export function localeOfPath(pathname: string): UiLocale | undefined {
  const segment = pathname.split("/")[1] ?? "";
  return isLocale(segment) ? segment : undefined;
}

/** 言語のないパス（`/`・`/play`）に、言語のセグメントを付ける。 */
export function localizedPath(locale: UiLocale, pathname: string): string {
  return pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
}

/**
 * Accept-Language から UI 言語を選ぶ。品質値（`q`）の高い順に見て、
 * 主言語のサブタグ（`ja-JP` の `ja`）が UI 言語に当たった最初のものを返す。
 * どれにも当たらなければ `DEFAULT_LOCALE` を返す。
 */
export function negotiateLocale(acceptLanguage: string | null): UiLocale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag = "", ...params] = part.trim().split(";");
      const q = params.map((param) => param.trim()).find((param) => param.startsWith("q="));
      return { tag: tag.trim().toLowerCase(), quality: q ? Number(q.slice(2)) : 1 };
    })
    .filter(({ tag, quality }) => tag !== "" && quality > 0)
    // sort は安定なので、品質値が同じなら書かれた順を保つ。
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of ranked) {
    const primary = tag.split("-")[0] ?? "";
    if (isLocale(primary)) return primary;
  }
  return DEFAULT_LOCALE;
}
