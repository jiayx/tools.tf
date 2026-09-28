import { describe, expect, it } from 'vitest'
import {
  QrInputError,
  buildQrImageQuery,
  parseQrImageOptions,
  type QrImageOptions,
} from './image'
import app from './index'

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

  it('falls back for unsupported module shapes', () => {
    const options = parseQrImageOptions(new URLSearchParams({ dotType: 'unsupported-shape' }))

    expect(options.dotType).toBe('rounded')
    expect(buildQrImageQuery(options)).toContain('dotType=rounded')
  })
})

describe('QR image endpoint', () => {
  it('serves an SVG image', async () => {
    const response = await app.request('/image?data=https%3A%2F%2Ftools.tf&size=320&margin=48')
    const svg = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('image/svg+xml')
    expect(svg).toContain('<svg')
    expect(svg).toContain('width="320"')
    expect(svg).toContain('height="320"')
  })
})
