import BaseQRCodeStyling from 'qr-code-styling'
import type {
  CornerDotType,
  CornerSquareType,
  DotType,
  DownloadOptions,
  DrawType,
  ErrorCorrectionLevel,
  ExtensionFunction,
  FileExtension,
  Gradient,
  GradientType,
  Mode,
  Options,
  QRCode,
  ShapeType,
  TypeNumber,
} from 'qr-code-styling'
import { FakeJSDOM } from './fake-dom'

export type {
  CornerDotType,
  CornerSquareType,
  DotType,
  DownloadOptions,
  DrawType,
  ErrorCorrectionLevel,
  ExtensionFunction,
  FileExtension,
  Gradient,
  GradientType,
  Mode,
  Options,
  QRCode,
  ShapeType,
  TypeNumber,
}

export { FakeJSDOM }

export interface WorkerOptions extends Options {
  jsdom?: typeof FakeJSDOM
}

function shouldUseWorkerDom() {
  return typeof window === 'undefined' || typeof document === 'undefined'
}

export default class QRCodeStyling extends BaseQRCodeStyling {
  constructor(options?: Partial<WorkerOptions>) {
    super({
      ...options,
      jsdom: options?.jsdom ?? (shouldUseWorkerDom() ? (FakeJSDOM as never) : undefined),
    })
  }

  update(options?: Partial<WorkerOptions>): void {
    super.update({
      ...options,
      jsdom: options?.jsdom ?? (shouldUseWorkerDom() ? (FakeJSDOM as never) : undefined),
    })
  }

  async getRawData(extension?: FileExtension): Promise<Blob | Buffer | null> {
    if ((extension ?? 'png').toLowerCase() === 'svg') {
      const instance = this as unknown as {
        _qr?: unknown
        _window: { XMLSerializer: new () => { serializeToString(node: unknown): string } }
        _getElement(fileExtension: 'svg'): Promise<unknown>
      }

      if (!instance._qr) {
        throw new Error('QR code is empty')
      }

      const element = await instance._getElement('svg')
      const serializer = new instance._window.XMLSerializer()
      const svg = `<?xml version="1.0" standalone="no"?>\r\n${serializer.serializeToString(element)}`

      return new Blob([svg], { type: 'image/svg+xml' })
    }

    return super.getRawData(extension)
  }

  async getSvgString(): Promise<string> {
    const raw = await this.getRawData('svg')

    if (!raw) {
      throw new Error('QR code is empty')
    }

    if (typeof Blob !== 'undefined' && raw instanceof Blob) {
      return raw.text()
    }

    if (typeof Buffer !== 'undefined' && raw instanceof Buffer) {
      return raw.toString('utf8')
    }

    return String(raw)
  }
}
