import { describe, expect, it } from 'vitest'
import { QrInputError, buildQrImageQuery, parseQrImageOptions, type QrImageOptions } from './image'

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
