import { browserLocale, localeTag, pick } from '@tools/i18n';

export const locale = browserLocale();
export const languageTag = localeTag(locale);
export const t = (en: string, zh: string) => pick(locale, { en, zh });
