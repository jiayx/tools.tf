import { describe, test, expect } from 'vitest'
import { parseTime, getOffsetMinutes, formatOffset } from '../src/convert'

const NOW = new Date('2026-04-09T12:00:00.000Z')

describe('time zones', () => {
  test.each([
    ['Asia/Shanghai', 480, 'UTC+08:00'],
    ['America/New_York', -240, 'UTC-04:00'],
    ['UTC', 0, 'UTC+00:00'],
    ['Asia/Kolkata', 330, 'UTC+05:30'],
  ])('resolves and formats %s', (zone, minutes, label) => {
    expect(getOffsetMinutes(zone, NOW)).toBe(minutes)
    expect(formatOffset(minutes)).toBe(label)
  })
})

describe('natural-language time parsing', () => {
  test.each([
    ['明天下午9点开会', 'Asia/Shanghai', 'zh', '2026-04-10T13:00:00.000Z'],
    ['tomorrow 9am', 'America/New_York', 'en', '2026-04-10T13:00:00.000Z'],
    ['tomorrow 9am', 'America/New_York', 'zh-CN', '2026-04-10T13:00:00.000Z'],
    ['demain 9h', 'Europe/Paris', 'fr-FR', '2026-04-10T07:00:00.000Z'],
    ['mañana 9am', 'Europe/Madrid', 'es-ES', '2026-04-10T07:00:00.000Z'],
  ])('parses %s in %s with locale %s', (text, zone, locale, expected) => {
    const result = parseTime(text, zone, locale, NOW)
    if ('error' in result) throw new Error(result.error)
    expect(result.eventDate.toISOString()).toBe(expected)
    expect(text).toContain(result.parsedText)
    expect(result.parsedText).not.toBe('')
  })

  test('uses the event-day offset across a DST transition', () => {
    const beforeDstSwitch = new Date('2026-03-08T04:30:00.000Z')
    const result = parseTime('tomorrow 9am', 'America/New_York', 'en', beforeDstSwitch)
    if ('error' in result) throw new Error(result.error)
    expect(result.eventDate.toISOString()).toBe('2026-03-08T13:00:00.000Z')
  })

  test.each([
    ['', 'Asia/Shanghai', 'Enter a time description'],
    ['hello world nothing here', 'Asia/Shanghai', 'No time found. Try adding a date or time of day'],
    ['tomorrow 9am', 'Mars/Base', 'The source timezone is invalid'],
  ])('rejects invalid input %s in %s', (text, zone, error) => {
    expect(parseTime(text, zone, 'en', NOW)).toEqual({ error })
  })
})
