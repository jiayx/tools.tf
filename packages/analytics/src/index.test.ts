import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
import { GoogleAnalytics, measurementId } from './index'

async function scriptFor(url: string) {
  const markup = await GoogleAnalytics({ url })
  return markup?.toString().replace(/^<script>|<\/script>$/g, '')
}

describe('Google Analytics', () => {
  it('omits analytics on local, preview, HTTP and unrelated hosts', () => {
    for (const url of [
      'http://localhost:5173/',
      'https://tools-index.example.workers.dev/',
      'https://preview.tools.tf/',
      'https://tools.tf.example.com/',
      'http://qr.tools.tf/',
    ]) expect(GoogleAnalytics({ url })).toBeNull()
  })

  it('enables all eight apps and both main-site hostnames', async () => {
    for (const host of ['tools.tf', 'www.tools.tf', 'datetime', 'diff', 'icon', 'ip', 'json', 'password', 'qr']) {
      const domain = host.includes('.') ? host : `${host}.tools.tf`
      expect(await scriptFor(`https://${domain}/`)).toContain(measurementId)
    }
  })

  it('queues one page configuration, sanitizes URLs and loads asynchronously only once', async () => {
    const source = await scriptFor('https://qr.tools.tf/')
    const scripts: Record<string, unknown>[] = []
    const window: { dataLayer: IArguments[] } = { dataLayer: [] }
    const context = {
      URL, window,
      location: new URL('https://qr.tools.tf/?data=secret#private'),
      document: {
        referrer: 'https://example.com/source?token=secret#private',
        createElement: () => ({}),
        head: { appendChild: (script: Record<string, unknown>) => scripts.push(script) },
      },
    }
    runInNewContext(source!, context)
    runInNewContext(source!, context)
    expect(window.dataLayer.map(args => Array.from(args))).toEqual([
      ['js', expect.anything()],
      ['config', measurementId, {
        page_location: 'https://qr.tools.tf/',
        page_referrer: 'https://example.com/source',
        cookie_domain: 'tools.tf',
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      }],
    ])
    expect(scripts).toEqual([{
      async: true,
      src: `https://www.googletagmanager.com/gtag/js?id=${measurementId}`,
      referrerPolicy: 'strict-origin',
    }])
  })

  it('does not initialize if production HTML is opened on a preview host', async () => {
    const window = {}
    runInNewContext((await scriptFor('https://tools.tf/'))!, {
      window, location: new URL('https://preview.tools.tf/'),
    })
    expect(window).toEqual({})
  })
})
