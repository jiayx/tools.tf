/** @jsxImportSource hono/jsx */
import { pick, resolveLocale } from '@tools/i18n'
import { Hono } from 'hono'
import QRCodeStyling from 'qr-code-styling-worker'
import {
  QrInputError,
  buildQrCodeStylingOptions,
  parseQrImageOptions,
} from './image'
import { renderer } from './renderer'

const app = new Hono()

app.use(renderer)

app.get('/image', async (c) => {
  const locale = resolveLocale(c.req.header('Accept-Language'))
  try {
    const options = parseQrImageOptions(new URL(c.req.url).searchParams, locale)
    const qr = new QRCodeStyling(buildQrCodeStylingOptions(options))
    const svg = await qr.getSvgString()

    c.header('Content-Type', 'image/svg+xml; charset=utf-8')
    c.header('Cache-Control', 'public, max-age=300')
    c.header('Content-Disposition', 'inline; filename="qr.svg"')
    c.header('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'")
    c.header('X-Content-Type-Options', 'nosniff')

    return c.body(svg)
  } catch (error) {
    const message = error instanceof QrInputError ? error.message : pick(locale, {
      en: 'Unable to generate the QR code. Shorten the content or adjust the options.',
      zh: '无法生成二维码，请缩短内容或调整参数',
    })
    return c.json({ error: message }, 400)
  }
})

app.get('/', (c) => {
  return c.render(<div id="root"></div>)
})

export default app
