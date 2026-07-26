/** @jsxImportSource react */
import { parseDiffFromFile, type FileDiffOptions, type SupportedLanguages } from '@pierre/diffs'
import { FileDiff } from '@pierre/diffs/react'
import { useDeferredValue, useMemo, useState } from 'react'
import { detectLanguage } from './detectLanguage'

const SAMPLE_LEFT = `export function greet(name: string) {
  return 'Hello, ' + name + '!'
}

export function summarize(count: number) {
  return 'You have ' + count + ' notifications.'
}
`

const SAMPLE_RIGHT = `export function greet(name: string) {
  return 'Hi, ' + name + '!'
}

export function summarize(count: number) {
  return 'You have ' + count + ' unread notifications.'
}

export function signOff() {
  return 'See you soon.'
}
`

const LANGUAGES: { label: string; value: SupportedLanguages | 'auto' }[] = [
  { label: '自动检测', value: 'auto' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TSX', value: 'tsx' },
  { label: 'JSX', value: 'jsx' },
  { label: 'Python', value: 'python' },
  { label: 'Go', value: 'go' },
  { label: 'Rust', value: 'rust' },
  { label: 'Java', value: 'java' },
  { label: 'C', value: 'c' },
  { label: 'C++', value: 'cpp' },
  { label: 'CSS', value: 'css' },
  { label: 'HTML', value: 'html' },
  { label: 'JSON', value: 'json' },
  { label: 'YAML', value: 'yaml' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'Shell', value: 'shellscript' },
  { label: 'SQL', value: 'sql' },
]

const MAX_TEXT_LENGTH = 500_000

const diffOptions: FileDiffOptions<undefined> = {
  diffStyle: 'split',
  diffIndicators: 'bars',
  lineDiffType: 'word',
  overflow: 'wrap',
  themeType: 'system',
  expandUnchanged: true,
  collapsedContextThreshold: 2,
}

const countLines = (value: string) => value === '' ? 0 : value.split('\n').length

export function DiffApp() {
  const [leftText, setLeftText] = useState(SAMPLE_LEFT)
  const [rightText, setRightText] = useState(SAMPLE_RIGHT)
  // 'auto' = follow detection; anything else = user override
  const [langPref, setLangPref] = useState<SupportedLanguages | 'auto'>('auto')
  const deferredLeftText = useDeferredValue(leftText)
  const deferredRightText = useDeferredValue(rightText)
  const tooLarge =
    leftText.length > MAX_TEXT_LENGTH ||
    rightText.length > MAX_TEXT_LENGTH ||
    deferredLeftText.length > MAX_TEXT_LENGTH ||
    deferredRightText.length > MAX_TEXT_LENGTH

  const detectedLang = useMemo(() => {
    const sample = `${deferredLeftText}\n${deferredRightText}`.slice(0, 100_000)
    return detectLanguage(sample) ?? 'text'
  }, [deferredLeftText, deferredRightText])

  const lang: SupportedLanguages = langPref === 'auto' ? detectedLang : langPref

  const handleLangChange = (value: string) => {
    setLangPref(value as SupportedLanguages | 'auto')
  }

  const fileDiff = useMemo(() => {
    return parseDiffFromFile(
      { name: 'before', contents: tooLarge ? '' : deferredLeftText, lang },
      { name: 'after', contents: tooLarge ? '' : deferredRightText, lang },
    )
  }, [deferredLeftText, deferredRightText, lang, tooLarge])

  const summary = useMemo(() => {
    let additions = 0
    let deletions = 0

    for (const hunk of fileDiff.hunks) {
      for (const block of hunk.hunkContent) {
        if (block.type !== 'change') continue
        additions += block.additions
        deletions += block.deletions
      }
    }

    return { additions, deletions, changed: additions + deletions > 0 }
  }, [fileDiff])

  const isEmpty = leftText === '' && rightText === ''

  const handleSwap = () => {
    setLeftText(rightText)
    setRightText(leftText)
  }

  const handleReset = () => {
    setLeftText(SAMPLE_LEFT)
    setRightText(SAMPLE_RIGHT)
  }

  const handleClear = () => {
    setLeftText('')
    setRightText('')
  }

  return (
    <main className="page">
      <header className="page-header">
        <div className="page-header__title">
          <span className="eyebrow">Diff</span>
          <span className="page-header__desc">把两段文本丢进来，立刻看清每一处变化。</span>
        </div>
        <div className="toolbar">
          <select
            className="lang-select"
            aria-label="语法高亮语言"
            value={langPref}
            onChange={(e) => handleLangChange(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}{l.value === 'auto' && langPref === 'auto' ? ` (${detectedLang})` : ''}</option>
            ))}
          </select>
          <button type="button" className="ghost-button" onClick={handleSwap}>
            交换左右
          </button>
          <button type="button" className="ghost-button" onClick={handleReset}>
            示例文本
          </button>
          <button type="button" className="ghost-button" onClick={handleClear}>
            清空
          </button>
        </div>
      </header>

      <section className="workbench">
        <div className="panel controls-panel">
          <div className="editor-grid">
            <label className="editor-card">
              <div className="editor-card__header">
                <span className="editor-card__label">原始文本</span>
                <span className="editor-card__meta">{countLines(leftText)} 行</span>
              </div>
              <textarea
                value={leftText}
                onChange={(event) => setLeftText(event.target.value)}
                spellCheck={false}
                placeholder="在这里粘贴旧版本文本"
              />
            </label>

            <label className="editor-card">
              <div className="editor-card__header">
                <span className="editor-card__label">更新后文本</span>
                <span className="editor-card__meta">{countLines(rightText)} 行</span>
              </div>
              <textarea
                value={rightText}
                onChange={(event) => setRightText(event.target.value)}
                spellCheck={false}
                placeholder="在这里粘贴新版本文本"
              />
            </label>
          </div>
        </div>

        <div className="panel diff-panel">
          <div className="panel__header panel__header--stacked">
            <div>
              <h2>Diff 结果</h2>
              <p>分栏展示，支持行内高亮与自动折叠未改动区域。</p>
            </div>
            <div className="summary-pills" aria-label="diff summary">
              <span className={`summary-pill ${summary.changed ? 'summary-pill--active' : ''}`}>
                {summary.changed ? '有变化' : '没有差异'}
              </span>
              <span className="summary-pill summary-pill--add">+{summary.additions}</span>
              <span className="summary-pill summary-pill--delete">-{summary.deletions}</span>
            </div>
          </div>

          <div className="diff-shell">
            {tooLarge ? (
              <div className="diff-empty">单侧文本不能超过 500,000 个字符</div>
            ) : isEmpty ? (
              <div className="diff-empty">输入文本后这里会显示差异</div>
            ) : !summary.changed ? (
              <div className="diff-empty">两段文本完全相同，没有差异</div>
            ) : (
              <FileDiff className="diff-view" fileDiff={fileDiff} options={diffOptions} />
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
