/** @jsxImportSource react */
import { parseDiffFromFile, type FileDiffOptions, type SupportedLanguages } from '@pierre/diffs'
import { FileDiff } from '@pierre/diffs/react'
import { browserLocale, pick } from '@tools/i18n'
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
  { label: 'Auto', value: 'auto' },
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
  const locale = browserLocale()
  const copy = pick(locale, {
    en: {
      description: 'Drop in two text blocks and see every change instantly.',
      auto: 'Auto',
      language: 'Syntax highlighting language',
      swap: 'Swap sides',
      sample: 'Sample text',
      clear: 'Clear',
      original: 'Original text',
      updated: 'Updated text',
      lines: (count: number) => `${count} lines`,
      oldPlaceholder: 'Paste the old text here',
      newPlaceholder: 'Paste the new text here',
      result: 'Diff result',
      resultHelp: 'Split view with inline highlighting and automatic folding of unchanged regions.',
      summary: 'Diff summary',
      changed: 'Changed',
      unchanged: 'No differences',
      tooLarge: 'Each side must contain no more than 500,000 characters',
      empty: 'Enter text to see the differences',
      identical: 'The two text blocks are identical',
    },
    zh: {
      description: '把两段文本放进来，立刻看清每一处变化。',
      auto: '自动检测',
      language: '语法高亮语言',
      swap: '交换左右',
      sample: '示例文本',
      clear: '清空',
      original: '原始文本',
      updated: '更新后文本',
      lines: (count: number) => `${count} 行`,
      oldPlaceholder: '在这里粘贴旧版本文本',
      newPlaceholder: '在这里粘贴新版本文本',
      result: 'Diff 结果',
      resultHelp: '分栏展示，支持行内高亮与自动折叠未改动区域。',
      summary: '差异摘要',
      changed: '有变化',
      unchanged: '没有差异',
      tooLarge: '单侧文本不能超过 500,000 个字符',
      empty: '输入文本后这里会显示差异',
      identical: '两段文本完全相同，没有差异',
    },
  })
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
          <span className="page-header__desc">{copy.description}</span>
        </div>
        <div className="toolbar">
          <select
            className="lang-select"
            aria-label={copy.language}
            value={langPref}
            onChange={(e) => handleLangChange(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.value === 'auto' ? copy.auto : l.label}{l.value === 'auto' && langPref === 'auto' ? ` (${detectedLang})` : ''}</option>
            ))}
          </select>
          <button type="button" className="ghost-button" onClick={handleSwap}>
            {copy.swap}
          </button>
          <button type="button" className="ghost-button" onClick={handleReset}>
            {copy.sample}
          </button>
          <button type="button" className="ghost-button" onClick={handleClear}>
            {copy.clear}
          </button>
        </div>
      </header>

      <section className="workbench">
        <div className="panel controls-panel">
          <div className="editor-grid">
            <label className="editor-card">
              <div className="editor-card__header">
                <span className="editor-card__label">{copy.original}</span>
                <span className="editor-card__meta">{copy.lines(countLines(leftText))}</span>
              </div>
              <textarea
                value={leftText}
                onChange={(event) => setLeftText(event.target.value)}
                spellCheck={false}
                placeholder={copy.oldPlaceholder}
              />
            </label>

            <label className="editor-card">
              <div className="editor-card__header">
                <span className="editor-card__label">{copy.updated}</span>
                <span className="editor-card__meta">{copy.lines(countLines(rightText))}</span>
              </div>
              <textarea
                value={rightText}
                onChange={(event) => setRightText(event.target.value)}
                spellCheck={false}
                placeholder={copy.newPlaceholder}
              />
            </label>
          </div>
        </div>

        <div className="panel diff-panel">
          <div className="panel__header panel__header--stacked">
            <div>
              <h2>{copy.result}</h2>
              <p>{copy.resultHelp}</p>
            </div>
            <div className="summary-pills" aria-label={copy.summary}>
              <span className={`summary-pill ${summary.changed ? 'summary-pill--active' : ''}`}>
                {summary.changed ? copy.changed : copy.unchanged}
              </span>
              <span className="summary-pill summary-pill--add">+{summary.additions}</span>
              <span className="summary-pill summary-pill--delete">-{summary.deletions}</span>
            </div>
          </div>

          <div className="diff-shell">
            {tooLarge ? (
              <div className="diff-empty">{copy.tooLarge}</div>
            ) : isEmpty ? (
              <div className="diff-empty">{copy.empty}</div>
            ) : !summary.changed ? (
              <div className="diff-empty">{copy.identical}</div>
            ) : (
              <FileDiff className="diff-view" fileDiff={fileDiff} options={diffOptions} />
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
