/** @jsxImportSource react */
import { json } from '@codemirror/lang-json'
import CodeMirror, { EditorView } from '@uiw/react-codemirror'
import { browserLocale, pick } from '@tools/i18n'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { minifyJson, type IndentValue, type JsonResult } from './json-format'

const PLACEHOLDER = `{\n  "paste": "your JSON here"\n}`
const COPY_FEEDBACK_MS = 2000
const FORMAT_DEBOUNCE_MS = 150
const MAX_JSON_LENGTH = 2_000_000

type CopyState = 'idle' | 'success' | 'error'

const baseTheme = EditorView.theme({
  '&': { fontSize: '13px', height: '100%' },
  '.cm-scroller': { fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace", overflow: 'auto' },
  '.cm-content': { padding: '16px 0' },
  '&.cm-focused': { outline: 'none' },
})

export function JsonApp() {
  const copy = useMemo(() => pick(browserLocale(), {
    en: {
      title: 'JSON Formatter',
      indent: 'Indent',
      spaces: (count: number) => `${count} spaces`,
      tab: 'Tab',
      format: 'Format',
      minify: 'Minify',
      copy: 'Copy',
      copied: 'Copied',
      copyFailed: 'Copy failed',
      clear: 'Clear',
      input: 'Input',
      output: 'Output',
      valid: 'Valid',
      workerFailed: 'The formatting worker failed',
      tooLarge: 'JSON cannot exceed 2,000,000 characters',
    },
    zh: {
      title: 'JSON 格式化',
      indent: '缩进',
      spaces: (count: number) => `${count} 空格`,
      tab: '制表符',
      format: '格式化',
      minify: '压缩',
      copy: '复制',
      copied: '已复制',
      copyFailed: '复制失败',
      clear: '清空',
      input: '输入',
      output: '输出',
      valid: '有效',
      workerFailed: '格式化 Worker 运行失败',
      tooLarge: 'JSON 不能超过 2,000,000 个字符',
    },
  }), [])
  const indentOptions = useMemo<Array<{ label: string; value: IndentValue }>>(() => [
    { label: copy.spaces(2), value: 2 },
    { label: copy.spaces(4), value: 4 },
    { label: copy.tab, value: '\t' },
  ], [copy])
  const [input, setInput] = useState('')
  const [indent, setIndent] = useState<IndentValue>(2)
  const [result, setResult] = useState<JsonResult | null>(null)
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const copyTimeoutRef = useRef<number | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const requestIdRef = useRef(0)

  const resetCopyState = useCallback(() => {
    if (copyTimeoutRef.current !== null) {
      window.clearTimeout(copyTimeoutRef.current)
    }
    copyTimeoutRef.current = window.setTimeout(() => {
      setCopyState('idle')
      copyTimeoutRef.current = null
    }, COPY_FEEDBACK_MS)
  }, [])

  useEffect(() => {
    const worker = new Worker(new URL('./json.worker.ts', import.meta.url), { type: 'module' })
    workerRef.current = worker
    worker.onmessage = (event: MessageEvent<{ id: number; result: JsonResult }>) => {
      if (event.data.id === requestIdRef.current) {
        setResult(event.data.result)
      }
    }
    worker.onerror = () => {
      setResult({ ok: false, error: copy.workerFailed })
    }

    return () => {
      worker.terminate()
      workerRef.current = null
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [copy.workerFailed])

  useEffect(() => {
    const requestId = ++requestIdRef.current
    if (!input.trim()) {
      setResult(null)
      return
    }
    if (input.length > MAX_JSON_LENGTH) {
      setResult({ ok: false, error: copy.tooLarge })
      return
    }

    const timer = window.setTimeout(() => {
      workerRef.current?.postMessage({ id: requestId, raw: input, indent })
    }, FORMAT_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [copy.tooLarge, input, indent])

  const outputValue = result?.ok ? result.value : ''

  const handleFormat = useCallback(() => {
    if (result?.ok) {
      setInput(result.value)
    }
  }, [result])

  const handleMinify = useCallback(() => {
    const r = minifyJson(input)
    if (r.ok) setInput(r.value)
  }, [input])

  const handleCopy = useCallback(async () => {
    if (!outputValue) return
    try {
      await navigator.clipboard.writeText(outputValue)
      setCopyState('success')
    } catch {
      setCopyState('error')
    }
    resetCopyState()
  }, [outputValue, resetCopyState])

  const handleClear = useCallback(() => {
    setInput('')
  }, [])

  const extensions = useMemo(() => [json(), baseTheme], [])

  return (
    <div className="page">
      <div className="topbar">
        <div className="topbar__title">
          <span className="eyebrow">tools.tf</span>
          <h1 className="page-header__name">{copy.title}</h1>
        </div>
        <div className="topbar__actions">
          <label className="indent-label">
            {copy.indent}
            <select
              className="indent-select"
              value={String(indent)}
              onChange={(e) => {
                const next = indentOptions.find((option) => String(option.value) === e.target.value)
                setIndent(next?.value ?? 2)
              }}
            >
              {indentOptions.map((option) => (
                <option key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button className="btn" onClick={handleFormat} disabled={!result?.ok}>
            {copy.format}
          </button>
          <button className="btn" onClick={handleMinify} disabled={!result?.ok}>
            {copy.minify}
          </button>
          <button
            className={`btn btn--primary${copyState === 'success' ? ' btn--copied' : ''}${copyState === 'error' ? ' btn--error' : ''}`}
            onClick={handleCopy}
            disabled={!outputValue}
          >
            {copyState === 'success' ? copy.copied : copyState === 'error' ? copy.copyFailed : copy.copy}
          </button>
          <button className="btn btn--ghost" onClick={handleClear} disabled={!input}>
            {copy.clear}
          </button>
        </div>
      </div>

      {result && !result.ok && (
        <div className="error-bar">
          <span className="error-bar__icon">✕</span>
          {result.error}
        </div>
      )}

      <div className="editors">
        {/* Input */}
        <div className="editor-wrap">
          <div className="editor-label">{copy.input}</div>
          <div className="editor-box">
            <CodeMirror
              value={input}
              onChange={setInput}
              extensions={extensions}
              placeholder={PLACEHOLDER}
              height="100%"
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
                bracketMatching: true,
              }}
            />
          </div>
        </div>

        {/* Output */}
        <div className="editor-wrap">
          <div className="editor-label">
            {copy.output}
            {result?.ok && (
              <span className="editor-label__badge editor-label__badge--ok">✓ {copy.valid}</span>
            )}
          </div>
          <div className={`editor-box${result && !result.ok ? ' editor-box--error' : ''}`}>
            <CodeMirror
              value={outputValue}
              readOnly
              extensions={extensions}
              height="100%"
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: false,
                bracketMatching: true,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
