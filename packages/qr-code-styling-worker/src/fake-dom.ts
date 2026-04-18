type ChildNode = FakeElement | FakeTextNode

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function decodeBase64(value: string) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }

  return bytes
}

function parseDataUrl(dataUrl: string) {
  const match = /^data:([^;,]+)?((?:;[^,]+)*?),(.*)$/s.exec(dataUrl)
  if (!match) {
    throw new Error('Invalid data URL')
  }

  const mimeType = match[1] || 'text/plain;charset=US-ASCII'
  const meta = match[2] || ''
  const payload = match[3] || ''

  if (meta.includes(';base64')) {
    return {
      mimeType,
      bytes: decodeBase64(payload),
    }
  }

  return {
    mimeType,
    bytes: new TextEncoder().encode(decodeURIComponent(payload)),
  }
}

function readUint16(bytes: Uint8Array, offset: number) {
  return (bytes[offset] << 8) | bytes[offset + 1]
}

function readUint32(bytes: Uint8Array, offset: number) {
  return (
    (bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3]
  ) >>> 0
}

function parseSvgSize(svgText: string) {
  const widthMatch = /\bwidth=["']([\d.]+)(px)?["']/i.exec(svgText)
  const heightMatch = /\bheight=["']([\d.]+)(px)?["']/i.exec(svgText)

  if (widthMatch && heightMatch) {
    return {
      width: Number(widthMatch[1]),
      height: Number(heightMatch[1]),
    }
  }

  const viewBoxMatch = /\bviewBox=["'][^"']*?([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)["']/i.exec(svgText)
  if (viewBoxMatch) {
    return {
      width: Number(viewBoxMatch[3]),
      height: Number(viewBoxMatch[4]),
    }
  }

  return { width: 256, height: 256 }
}

function parsePngSize(bytes: Uint8Array) {
  if (bytes.length < 24) return null
  if (readUint32(bytes, 0) !== 0x89504e47) return null
  return {
    width: readUint32(bytes, 16),
    height: readUint32(bytes, 20),
  }
}

function parseGifSize(bytes: Uint8Array) {
  if (bytes.length < 10) return null
  const header = new TextDecoder().decode(bytes.slice(0, 6))
  if (header !== 'GIF87a' && header !== 'GIF89a') return null
  return {
    width: bytes[6] | (bytes[7] << 8),
    height: bytes[8] | (bytes[9] << 8),
  }
}

function parseJpegSize(bytes: Uint8Array) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null

  let offset = 2
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1
      continue
    }

    const marker = bytes[offset + 1]
    const blockLength = readUint16(bytes, offset + 2)
    const isStartOfFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      ![0xc4, 0xc8, 0xcc].includes(marker)

    if (isStartOfFrame) {
      return {
        height: readUint16(bytes, offset + 5),
        width: readUint16(bytes, offset + 7),
      }
    }

    if (blockLength < 2) break
    offset += 2 + blockLength
  }

  return null
}

function parseWebpSize(bytes: Uint8Array) {
  if (bytes.length < 30) return null
  const riff = new TextDecoder().decode(bytes.slice(0, 4))
  const webp = new TextDecoder().decode(bytes.slice(8, 12))
  if (riff !== 'RIFF' || webp !== 'WEBP') return null

  const chunk = new TextDecoder().decode(bytes.slice(12, 16))

  if (chunk === 'VP8X') {
    return {
      width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
      height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
    }
  }

  return null
}

async function readImageSource(src: string) {
  if (src.startsWith('data:')) {
    const { mimeType, bytes } = parseDataUrl(src)
    return { mimeType, bytes, originalSrc: src }
  }

  const response = await fetch(src)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`)
  }

  const mimeType = response.headers.get('content-type') || 'application/octet-stream'
  const bytes = new Uint8Array(await response.arrayBuffer())
  const dataUrl = `data:${mimeType};base64,${btoa(String.fromCharCode(...bytes))}`

  return { mimeType, bytes, originalSrc: dataUrl }
}

function inferImageSize(mimeType: string, bytes: Uint8Array) {
  if (mimeType.includes('svg')) {
    return parseSvgSize(new TextDecoder().decode(bytes))
  }

  return (
    parsePngSize(bytes) ||
    parseGifSize(bytes) ||
    parseJpegSize(bytes) ||
    parseWebpSize(bytes) || {
      width: 256,
      height: 256,
    }
  )
}

class FakeTextNode {
  readonly nodeType = 3
  data: string

  constructor(data: string) {
    this.data = data
  }
}

class FakeElement {
  readonly nodeType = 1
  readonly children: ChildNode[] = []
  readonly attributes = new Map<string, string>()
  textContent = ''
  tagName: string
  namespaceURI: string | null

  constructor(tagName: string, namespaceURI: string | null) {
    this.tagName = tagName
    this.namespaceURI = namespaceURI
  }

  appendChild(child: ChildNode) {
    this.children.push(child)
    return child
  }

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value)
  }

  setAttributeNS(_namespace: string | null, name: string, value: string) {
    this.attributes.set(name, value)
  }

  getAttribute(name: string) {
    return this.attributes.get(name) ?? null
  }
}

class FakeDocument {
  createElementNS(namespaceURI: string | null, tagName: string) {
    return new FakeElement(tagName, namespaceURI)
  }

  createElement(tagName: string) {
    return new FakeElement(tagName, null)
  }

  createTextNode(data: string) {
    return new FakeTextNode(data)
  }
}

class FakeXMLSerializer {
  serializeToString(node: ChildNode): string {
    if (node instanceof FakeTextNode) {
      return escapeXml(node.data)
    }

    const attrs = new Map(node.attributes)

    if (node.namespaceURI && !attrs.has('xmlns')) {
      attrs.set('xmlns', node.namespaceURI)
    }

    const serializedAttrs = Array.from(attrs.entries())
      .map(([key, value]) => ` ${key}="${escapeXml(value)}"`)
      .join('')

    const content: string = [
      node.textContent ? escapeXml(node.textContent) : '',
      ...node.children.map((child): string => this.serializeToString(child)),
    ].join('')

    return `<${node.tagName}${serializedAttrs}>${content}</${node.tagName}>`
  }
}

class UnsupportedWorkerImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  crossOrigin?: string
  width = 0
  height = 0
  private _src = ''

  get src() {
    return this._src
  }

  set src(value: string) {
    this._src = value

    void readImageSource(value)
      .then(({ mimeType, bytes, originalSrc }) => {
        this._src = originalSrc
        const { width, height } = inferImageSize(mimeType, bytes)
        this.width = width
        this.height = height
        this.onload?.()
      })
      .catch(() => {
        this.onerror?.()
      })
  }
}

class UnsupportedXMLHttpRequest {
  onload: (() => void) | null = null
  responseType = ''
  response: Blob | null = null
  private _url = ''

  open(_method: string, url: string) {
    this._url = url
  }

  send() {
    void readImageSource(this._url).then(({ mimeType, bytes }) => {
      this.response = new Blob([bytes], { type: mimeType })
      this.onload?.()
    })
  }
}

class UnsupportedFileReader {
  onloadend: (() => void) | null = null
  result: string | ArrayBuffer | null = null

  readAsDataURL(blob: Blob) {
    void blob.arrayBuffer().then((buffer) => {
      const bytes = new Uint8Array(buffer)
      const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
      this.result = `data:${blob.type || 'application/octet-stream'};base64,${btoa(binary)}`
      this.onloadend?.()
    })
  }
}

export class FakeJSDOM {
  readonly window: {
    document: FakeDocument
    XMLSerializer: typeof FakeXMLSerializer
    Image: typeof UnsupportedWorkerImage
    XMLHttpRequest: typeof UnsupportedXMLHttpRequest
    FileReader: typeof UnsupportedFileReader
  }

  constructor() {
    this.window = {
      document: new FakeDocument(),
      XMLSerializer: FakeXMLSerializer,
      Image: UnsupportedWorkerImage,
      XMLHttpRequest: UnsupportedXMLHttpRequest,
      FileReader: UnsupportedFileReader,
    }
  }
}
