/** @jsxImportSource hono/jsx */
import { Hono } from 'hono'
import QRCodeStyling from 'qr-code-styling-worker'
import { parseQrImageOptions } from './image'
import { renderer } from './renderer'

const app = new Hono()

app.use(renderer)

app.get('/image', async (c) => {
  const options = parseQrImageOptions(new URL(c.req.url).searchParams)
  const qr = new QRCodeStyling({
    type: 'svg',
    width: options.size,
    height: options.size,
    margin: options.margin,
    data: options.data,
    qrOptions: {
      errorCorrectionLevel: options.errorLevel,
    },
    dotsOptions: {
      type: options.dotType,
      color: options.fgColor,
      gradient: options.useGradient
        ? {
            type: options.gradientType,
            rotation: 45,
            colorStops: [
              { offset: 0, color: options.gradientColor1 },
              { offset: 1, color: options.gradientColor2 },
            ],
          }
        : undefined,
    },
    cornersSquareOptions: {
      type: options.cornerSquareType,
      color: options.fgColor,
      gradient: options.useGradient
        ? {
            type: options.gradientType,
            rotation: 45,
            colorStops: [
              { offset: 0, color: options.gradientColor1 },
              { offset: 1, color: options.gradientColor2 },
            ],
          }
        : undefined,
    },
    cornersDotOptions: {
      type: options.cornerDotType,
      color: options.fgColor,
      gradient: options.useGradient
        ? {
            type: options.gradientType,
            rotation: 45,
            colorStops: [
              { offset: 0, color: options.gradientColor1 },
              { offset: 1, color: options.gradientColor2 },
            ],
          }
        : undefined,
    },
    backgroundOptions: {
      color: options.transparentBg ? 'rgba(0,0,0,0)' : options.bgColor,
    },
  })
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
