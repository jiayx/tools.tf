import { describe, expect, it } from 'vitest'
import app from './index'

describe('IP responses', () => {
  it('returns plain text for curl', async () => {
    const response = await app.request('https://ip.tools.tf/', {
      headers: {
        'CF-Connecting-IP': '203.0.113.10',
        'User-Agent': 'curl/8.0.0',
      },
    })

    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(response.headers.get('Content-Type')).toContain('text/plain')
    expect(await response.text()).toBe('203.0.113.10\n')
  })

  it('returns structured JSON on request', async () => {
    const response = await app.request('https://ip.tools.tf/?format=json', {
      headers: {
        Accept: 'application/json',
        'CF-Connecting-IP': '203.0.113.10',
        'CF-IPCountry': 'CN',
        'User-Agent': 'test',
      },
    })

    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.json()).toMatchObject({
      ip: '203.0.113.10',
      country: 'CN',
      isCurl: false,
    })
  })
})
