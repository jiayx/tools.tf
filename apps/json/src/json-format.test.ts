import { describe, expect, it } from 'vitest'
import { formatJson, minifyJson } from './json-format'

describe('JSON formatting', () => {
  it('formats with the requested indentation', () => {
    expect(formatJson('{"ok":true}', 2)).toEqual({
      ok: true,
      value: '{\n  "ok": true\n}',
    })
  })

  it('minifies valid JSON', () => {
    expect(minifyJson('{\n  "ok": true\n}')).toEqual({
      ok: true,
      value: '{"ok":true}',
    })
  })

  it('reports invalid JSON', () => {
    expect(formatJson('{"ok":}', 2)).toMatchObject({ ok: false })
    expect(minifyJson('not-json')).toMatchObject({ ok: false })
  })
})
