/** @jsxImportSource hono/jsx */
import { Hono } from 'hono'
import QRCodeStyling from 'qr-code-styling-worker'
import { buildQrCodeStylingOptions, parseQrImageOptions } from './image'
import { renderer } from './renderer'

const app = new Hono()

app.use(renderer)

app.get('/image', async (c) => {
  const options = parseQrImageOptions(new URL(c.req.url).searchParams)
  const qr = new QRCodeStyling(buildQrCodeStylingOptions(options))
  const svg = await qr.getSvgString()

  c.header('Content-Type', 'image/svg+xml; charset=utf-8')
  c.header('Cache-Control', 'public, max-age=300')
  c.header('Content-Disposition', 'inline; filename="qr.svg"')

  return c.body(svg)
})

app.get('/', (c) => {
  return c.render(<div id="root"></div>)
})

export default app
