import { describe, expect, it } from 'vitest'
import {
  QrInputError,
  buildQrImageQuery,
  ensureStandaloneSvgNamespace,
  parseQrImageOptions,
  type QrImageOptions,
} from './image'

describe('QR image input validation', () => {
  it('rejects remote logos on the public endpoint', () => {
    expect(() => parseQrImageOptions(new URLSearchParams({
      logo: 'https://example.com/logo.png',
    }))).toThrow(QrInputError)
  })

  it('rejects oversized payloads', () => {
    expect(() => parseQrImageOptions(new URLSearchParams({
      data: 'x'.repeat(3_000),
    }))).toThrow(/2953/)
  })

  it('does not serialize local logos into public URLs', () => {
    const options: QrImageOptions = {
      ...parseQrImageOptions(new URLSearchParams()),
      logoUrl: 'data:image/png;base64,AAAA',
    }

    expect(buildQrImageQuery(options)).not.toContain('logo')
  })
})

describe('standalone SVG output', () => {
  it('adds the default SVG namespace when the serializer omits it', () => {
    const svg = '<?xml version="1.0"?><svg viewBox="0 0 320 320"></svg>'

    expect(ensureStandaloneSvgNamespace(svg)).toContain(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">',
    )
  })

  it('preserves an existing default SVG namespace', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>'

    expect(ensureStandaloneSvgNamespace(svg)).toBe(svg)
  })
})
