export type Locale = 'en' | 'zh'

const normalizeLanguage = (language: string) => language.trim().toLowerCase().replace(/_/g, '-')

const parseAcceptLanguage = (header: string): string[] =>
  header
    .split(',')
    .map((entry, index) => {
      const [language, ...parameters] = entry.trim().split(';')
      const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith('q='))
      const quality = qualityParameter ? Number(qualityParameter.trim().slice(2)) : 1
      return {
        language,
        quality: Number.isFinite(quality) ? quality : 0,
        index,
      }
    })
    .filter((entry) => entry.language && entry.quality > 0)
    .sort((left, right) => right.quality - left.quality || left.index - right.index)
    .map((entry) => entry.language)

export const resolveLocale = (languages?: string | readonly string[] | null): Locale => {
  const candidates =
    typeof languages === 'string'
      ? parseAcceptLanguage(languages)
      : languages
        ? [...languages]
        : []

  for (const candidate of candidates) {
    const language = normalizeLanguage(candidate)
    if (language === 'zh' || language.startsWith('zh-')) return 'zh'
    if (language === 'en' || language.startsWith('en-')) return 'en'
  }

  return 'en'
}

export const browserLocale = (): Locale => {
  if (typeof navigator === 'undefined') return 'en'
  return resolveLocale(navigator.languages?.length ? navigator.languages : navigator.language)
}

export const localeFromDocument = (): Locale => {
  if (typeof document === 'undefined') return 'en'
  return resolveLocale(document.documentElement.lang)
}

export const localeTag = (locale: Locale) => (locale === 'zh' ? 'zh-CN' : 'en')

export const pick = <T>(locale: Locale, messages: { en: T; zh: T }): T => messages[locale]
