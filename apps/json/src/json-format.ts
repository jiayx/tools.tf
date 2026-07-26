export type JsonResult =
  | { ok: true; value: string }
  | { ok: false; error: string }

export type IndentValue = number | string

export function formatJson(raw: string, indent: IndentValue): JsonResult {
  try {
    const parsed = JSON.parse(raw)
    return { ok: true, value: JSON.stringify(parsed, null, indent) }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'JSON 无效' }
  }
}

export function minifyJson(raw: string): JsonResult {
  try {
    return { ok: true, value: JSON.stringify(JSON.parse(raw)) }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'JSON 无效' }
  }
}
