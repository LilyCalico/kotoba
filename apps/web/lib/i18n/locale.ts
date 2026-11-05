import { type UiLocale, uiLocaleSchema } from "@kotoba/shared";

/** UI 言語。URL の先頭のセグメント（`/ja`・`/en`）で決まる。 */
export const LOCALES: readonly UiLocale[] = uiLocaleSchema.options;

/** ブラウザの言語がどの UI 言語にも当たらないときの言語。api の `locale` の既定と揃える。 */
export const DEFAULT_LOCALE: UiLocale = "en";

/**
 * UI 言語の名前。言語名はその言語自身で書くのが通例のため、辞書ではなくここに持つ。
 * 言語の切り替えで、表示（`short`）と読み上げ（`name`）に使う。
 */
export const LOCALE_NAMES: Record<UiLocale, { short: string; name: string }> = {
  ja: { short: "Ja", name: "日本語" },
  en: { short: "En", name: "English" },
};

/** 画面で切り替えた UI 言語を覚える cookie。言語のない URL の振り分けで、Accept-Language より先に見る。 */
export const LOCALE_COOKIE = "locale";

/** `LOCALE_COOKIE` を残す期間（秒）。1 年。 */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

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

/**
 * 言語のない URL を振り分ける先の UI 言語。画面で切り替えた言語（`LOCALE_COOKIE` の値）があればそれを、
 * なければ Accept-Language から選んだ言語を返す。
 */
export function preferredLocale(cookieLocale: string | undefined, acceptLanguage: string | null): UiLocale {
  if (cookieLocale !== undefined && isLocale(cookieLocale)) return cookieLocale;
  return negotiateLocale(acceptLanguage);
}
