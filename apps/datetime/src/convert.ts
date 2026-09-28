import * as chrono from 'chrono-node'
import type { ParsedComponents } from 'chrono-node'

type ConvertResult = {
  eventDate: Date
  parsedText: string
}

type ConvertError = {
  error: string
}

type ParserLang = 'en' | 'zh' | 'ja' | 'de' | 'fr' | 'pt' | 'nl' | 'ru' | 'es' | 'uk' | 'it' | 'sv'

type ChronoParser = {
  parse: typeof chrono.parse
}

const parserByLang: Record<ParserLang, ChronoParser> = {
  en: chrono.en,
  zh: chrono.zh,
  ja: chrono.ja,
  de: chrono.de,
  fr: chrono.fr,
  pt: chrono.pt,
  nl: chrono.nl,
  ru: chrono.ru,
  es: chrono.es,
  uk: chrono.uk,
  it: chrono.it,
  sv: chrono.sv,
}

const allParserLangs = Object.keys(parserByLang) as ParserLang[]

function resolveUiLang(lang: string): ParserLang | null {
  const normalized = lang.toLowerCase()
  if (normalized in parserByLang) return normalized as ParserLang
  const primary = normalized.split('-')[0]
  return primary in parserByLang ? (primary as ParserLang) : null
}

function detectParserOrder(text: string, lang: string): ParserLang[] {
  const normalized = text.toLowerCase()
  const ordered = new Set<ParserLang>()
  const uiLang = resolveUiLang(lang)

  if (uiLang) ordered.add(uiLang)

  if (/[\u3040-\u30ff]/.test(text)) ordered.add('ja')
  if (/[\u4e00-\u9fff]/.test(text)) ordered.add('zh')
  if (/\b(tomorrow|today|tonight|next|am|pm|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/.test(normalized))
    ordered.add('en')
  if (/明天|今天|后天|下午|晚上|早上|周[一二三四五六日天]|下周|点|截止/.test(text)) ordered.add('zh')
  if (/明日|今日|明後日|午後|午前|来週|時|まで/.test(text)) ordered.add('ja')
  if (/\b(demain|aujourd'hui|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b/.test(normalized))
    ordered.add('fr')
  if (/\b(manana|mañana|hoy|lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\b/.test(normalized))
    ordered.add('es')
  if (/\b(morgen|heute|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|uhr)\b/.test(normalized))
    ordered.add('de')
  if (/\b(amanha|amanhã|hoje|segunda|terca|terça|quarta|quinta|sexta|sabado|sábado|domingo)\b/.test(normalized))
    ordered.add('pt')
  if (/\b(domani|oggi|luned[iì]|marted[iì]|mercoled[iì]|gioved[iì]|venerd[iì]|sabato|domenica)\b/.test(normalized))
    ordered.add('it')
  if (/\b(vandaag|morgen|maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag|uur)\b/.test(normalized))
    ordered.add('nl')
  if (/\b(i dag|imorgon|måndag|mandag|tisdag|onsdag|torsdag|fredag|lördag|lordag|söndag|sondag)\b/.test(normalized))
    ordered.add('sv')
  if (/сегодня|завтра|понедельник|вторник|среда|четверг|пятница|суббота|воскресенье/.test(text)) ordered.add('ru')
  if (/сьогодні|завтра|понеділок|вівторок|середа|четвер|п’ятниця|пятниця|субота|неділя/.test(text)) ordered.add('uk')

  ordered.add('en')
  ordered.add('zh')
  ordered.add('ja')

  for (const parserLang of allParserLangs) ordered.add(parserLang)

  return [...ordered]
}

export function getOffsetMinutes(timeZone: string, date = new Date()): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const parts = dtf.formatToParts(date)
  const filled: Record<string, number> = {}
  for (const part of parts) {
    if (part.type !== 'literal') filled[part.type] = Number(part.value)
  }
  const asUTC = Date.UTC(filled.year, filled.month - 1, filled.day, filled.hour, filled.minute, filled.second)
  return Math.round((asUTC - date.getTime()) / 60000)
}

export function formatOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMinutes)
  const h = String(Math.floor(abs / 60)).padStart(2, '0')
  const m = String(abs % 60).padStart(2, '0')
  return `UTC${sign}${h}:${m}`
}

function buildDateInTimeZone(components: ParsedComponents, timeZone: string): Date {
  const year = components.get('year')
  const month = components.get('month')
  const day = components.get('day')
  const hour = components.get('hour') ?? 12
  const minute = components.get('minute') ?? 0
  const second = components.get('second') ?? 0
  const millisecond = components.get('millisecond') ?? 0

  if (year === null || month === null || day === null) {
    throw new Error('Parsed result is missing date components')
  }

  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second, millisecond)
  let offsetMinutes = getOffsetMinutes(timeZone, new Date(utcGuess))
  let candidate = new Date(utcGuess - offsetMinutes * 60 * 1000)

  // Re-evaluate at the resolved instant so DST transitions use the event-day offset.
  for (let i = 0; i < 3; i += 1) {
    const nextOffset = getOffsetMinutes(timeZone, candidate)
    if (nextOffset === offsetMinutes) break
    offsetMinutes = nextOffset
    candidate = new Date(utcGuess - offsetMinutes * 60 * 1000)
  }

  return candidate
}

/**
 * Parse a natural-language time string in the context of `sourceZone`,
 * and return the resolved Date (UTC) plus metadata.
 *
 * @param text        Natural-language input, e.g. "明天下午9点开会"
 * @param sourceZone  IANA timezone of the sender, e.g. "Asia/Shanghai"
 * @param lang        BCP-47 language tag used to pick the chrono locale, e.g. "zh"
 * @param now         Override "now" for deterministic testing
 */
export function parseTime(
  text: string,
  sourceZone: string,
  lang = 'zh',
  now = new Date(),
): ConvertResult | ConvertError {
  const isChinese = lang.toLowerCase().startsWith('zh')
  const errors = isChinese
    ? {
        empty: '请输入时间描述',
        timezone: '原始时区无效',
        parse: '没有解析出时间，试试补充日期或时间段',
      }
    : {
        empty: 'Enter a time description',
        timezone: 'The source timezone is invalid',
        parse: 'No time found. Try adding a date or time of day',
      }
  const trimmed = text.trim()
  if (!trimmed) return { error: errors.empty }

  let sourceOffsetMin: number
  try {
    sourceOffsetMin = getOffsetMinutes(sourceZone, now)
  } catch {
    return { error: errors.timezone }
  }

  let parsed: ReturnType<typeof chrono.parse>[number] | undefined
  for (const parserLang of detectParserOrder(trimmed, lang)) {
    const results = parserByLang[parserLang].parse(trimmed, {
      instant: now,
      timezone: sourceOffsetMin,
    })
    if (results[0]) {
      parsed = results[0]
      break
    }
  }

  if (!parsed) return { error: errors.parse }

  return {
    eventDate: buildDateInTimeZone(parsed.start, sourceZone),
    parsedText: parsed.text,
  }
}
