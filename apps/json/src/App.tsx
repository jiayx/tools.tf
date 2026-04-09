/** @jsxImportSource react */
import { json } from '@codemirror/lang-json'
import CodeMirror, { EditorView } from '@uiw/react-codemirror'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const PLACEHOLDER = `{\n  "paste": "your JSON here"\n}`
const COPY_FEEDBACK_MS = 2000

type IndentValue = number | string
type CopyState = 'idle' | 'success' | 'error'

const INDENT_OPTIONS: Array<{ label: string; value: IndentValue }> = [
  { label: '2 空格', value: 2 },
  { label: '4 空格', value: 4 },
  { label: 'Tab', value: '\t' },
]

function tryFormat(raw: string, indent: IndentValue): { ok: true; value: string } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(raw)
    return { ok: true, value: JSON.stringify(parsed, null, indent) }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

function tryMinify(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.stringify(JSON.parse(raw)) }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

const baseTheme = EditorView.theme({
  '&': { fontSize: '13px', height: '100%' },
  '.cm-scroller': { fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace", overflow: 'auto' },
  '.cm-content': { padding: '16px 0' },
  '&.cm-focused': { outline: 'none' },
})

export function JsonApp() {
  const [input, setInput] = useState('')
  const [indent, setIndent] = useState<IndentValue>(2)
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const copyTimeoutRef = useRef<number | null>(null)

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
    return () => {
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])

  const result = useMemo(() => {
    if (!input.trim()) return null
    return tryFormat(input, indent)
  }, [input, indent])

  const outputValue = result?.ok ? result.value : ''

  const handleFormat = useCallback(() => {
    if (result?.ok) {
      setInput(result.value)
    }
  }, [result])

  const handleMinify = useCallback(() => {
    const r = tryMinify(input)
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
          <h1 className="page-header__name">JSON 格式化</h1>
        </div>
        <div className="topbar__actions">
          <label className="indent-label">
            缩进
            <select
              className="indent-select"
              value={String(indent)}
              onChange={(e) => {
                const next = INDENT_OPTIONS.find((option) => String(option.value) === e.target.value)
                setIndent(next?.value ?? 2)
              }}
            >
              {INDENT_OPTIONS.map((option) => (
                <option key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button className="btn" onClick={handleFormat} disabled={!result?.ok}>
            格式化
          </button>
          <button className="btn" onClick={handleMinify} disabled={!result?.ok}>
            压缩
          </button>
          <button
            className={`btn btn--primary${copyState === 'success' ? ' btn--copied' : ''}${copyState === 'error' ? ' btn--error' : ''}`}
            onClick={handleCopy}
            disabled={!outputValue}
          >
            {copyState === 'success' ? '已复制' : copyState === 'error' ? '复制失败' : '复制'}
          </button>
          <button className="btn btn--ghost" onClick={handleClear} disabled={!input}>
            清空
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
          <div className="editor-label">输入</div>
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
            输出
            {result?.ok && (
              <span className="editor-label__badge editor-label__badge--ok">✓ 有效</span>
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
