import { describe, test, expect } from 'vitest'
import { parseTime, getOffsetMinutes, formatOffset } from '../src/convert'

// Fixed "now" so tests are deterministic regardless of when they run.
// 2026-04-09 12:00:00 UTC  ->  Asia/Shanghai wall clock: 2026-04-09 20:00
const NOW = new Date('2026-04-09T12:00:00.000Z')
const TOMORROW_SHANGHAI = '2026-04-10'

describe('getOffsetMinutes', () => {
  test('Asia/Shanghai is UTC+8 (480 min)', () => {
    expect(getOffsetMinutes('Asia/Shanghai', NOW)).toBe(480)
  })

  test('America/New_York is UTC-4 in April (EDT, -240 min)', () => {
    expect(getOffsetMinutes('America/New_York', NOW)).toBe(-240)
  })

  test('UTC is 0', () => {
    expect(getOffsetMinutes('UTC', NOW)).toBe(0)
  })
})

describe('formatOffset', () => {
  test('480  → UTC+08:00', () => expect(formatOffset(480)).toBe('UTC+08:00'))
  test('-240 → UTC-04:00', () => expect(formatOffset(-240)).toBe('UTC-04:00'))
  test('0    → UTC+00:00', () => expect(formatOffset(0)).toBe('UTC+00:00'))
  test('330  → UTC+05:30 (Kolkata)', () => expect(formatOffset(330)).toBe('UTC+05:30'))
})

describe('parseTime — 明天下午9点开会', () => {
  const result = parseTime('明天下午9点开会', 'Asia/Shanghai', 'zh', NOW)

  test('should parse successfully (no error)', () => {
    expect('error' in result).toBe(false)
  })

  test('parsed text should contain the time fragment', () => {
    if ('error' in result) throw new Error(result.error)
    expect(result.parsedText).toMatch(/下午9点|下午9時|明天/)
  })

  test('eventDate should fall on tomorrow in Asia/Shanghai (2026-04-10)', () => {
    if ('error' in result) throw new Error(result.error)
    const localDate = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(result.eventDate)
    expect(localDate).toBe(TOMORROW_SHANGHAI)
  })

  test('eventDate should be 21:00 wall-clock in Asia/Shanghai', () => {
    if ('error' in result) throw new Error(result.error)
    const hour = Number(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Shanghai',
        hour: '2-digit',
        hour12: false,
      }).format(result.eventDate),
    )
    expect(hour).toBe(21) // "下午9点" = 21:00
  })

  test('in UTC the event should be 13:00 (21:00 Shanghai - 8h)', () => {
    if ('error' in result) throw new Error(result.error)
    expect(result.eventDate.getUTCHours()).toBe(13)
  })
})

describe('parseTime — error cases', () => {
  test('empty string returns error', () => {
    const r = parseTime('', 'Asia/Shanghai', 'zh', NOW)
    expect('error' in r).toBe(true)
  })

  test('unparseable text returns error', () => {
    const r = parseTime('hello world nothing here', 'Asia/Shanghai', 'en', NOW)
    expect('error' in r).toBe(true)
  })

  test('invalid timezone returns error', () => {
    const r = parseTime('tomorrow 9am', 'Mars/Base', 'en', NOW)
    expect(r).toEqual({ error: '原始时区无效' })
  })
})

describe('parseTime — English input', () => {
  test('tomorrow 9am in America/New_York', () => {
    const r = parseTime('tomorrow 9am', 'America/New_York', 'en', NOW)
    expect('error' in r).toBe(false)
    if ('error' in r) return
    const hour = Number(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        hour12: false,
      }).format(r.eventDate),
    )
    expect(hour).toBe(9)
  })

  test('falls back to English parsing even when UI language is zh-CN', () => {
    const r = parseTime('tomorrow 9am', 'America/New_York', 'zh-CN', NOW)
    expect('error' in r).toBe(false)
    if ('error' in r) return
    expect(r.eventDate.toISOString()).toBe('2026-04-10T13:00:00.000Z')
  })

  test('uses the event-day DST offset instead of the current-day offset', () => {
    // 2026-03-08 04:30 UTC -> 2026-03-07 23:30 in New York (still EST, UTC-5).
    // "tomorrow 9am" should land on 2026-03-08 09:00 in New York, which is EDT (UTC-4).
    const beforeDstSwitch = new Date('2026-03-08T04:30:00.000Z')
    const r = parseTime('tomorrow 9am', 'America/New_York', 'en', beforeDstSwitch)
    expect('error' in r).toBe(false)
    if ('error' in r) return

    expect(r.eventDate.toISOString()).toBe('2026-03-08T13:00:00.000Z')

    const local = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(r.eventDate)

    expect(local).toBe('03/08/2026, 09:00')
  })
})

describe('parseTime — additional locales', () => {
  test('French input is supported', () => {
    const r = parseTime('demain 9h', 'Europe/Paris', 'fr-FR', NOW)
    expect('error' in r).toBe(false)
    if ('error' in r) return

    const local = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(r.eventDate)

    expect(local).toBe('10/04/2026 09:00')
  })

  test('Spanish input is supported', () => {
    const r = parseTime('mañana 9am', 'Europe/Madrid', 'es-ES', NOW)
    expect('error' in r).toBe(false)
    if ('error' in r) return

    const local = new Intl.DateTimeFormat('es-ES', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(r.eventDate)

    expect(local).toBe('10/04/2026, 09:00')
  })
})
