/// <reference lib="webworker" />

import { formatJson, type IndentValue } from './json-format'

type FormatRequest = {
  id: number
  raw: string
  indent: IndentValue
}

self.onmessage = (event: MessageEvent<FormatRequest>) => {
  self.postMessage({
    id: event.data.id,
    result: formatJson(event.data.raw, event.data.indent),
  })
}
