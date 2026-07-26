/** @jsxImportSource react */
import { useCallback, useEffect, useState } from 'react'

const CHAR_SETS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{}|;:,.<>?',
}

// Characters that are visually ambiguous and easy to misread
const AMBIGUOUS = new Set('0O1lI2Z5S6b8B')

// Rejection-sampling random index: avoids modulo bias
function randomIndex(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max
  const buf = new Uint32Array(1)
  do { crypto.getRandomValues(buf) } while (buf[0] >= limit)
  return buf[0] % max
}

export interface Config {
  length: number
  upper: boolean
  lower: boolean
  digits: boolean
  symbols: boolean
  excludeAmbiguous: boolean
  count: number
}

export const DEFAULT_CONFIG: Config = {
  length: 16,
  upper: true,
  lower: true,
  digits: true,
  symbols: false,
  excludeAmbiguous: true,
  count: 1,
}

export function getStrength(password: string): { level: number; label: string; color: string } {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (password.length >= 16) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) return { level: 1, label: '弱', color: '#ef4444' }
  if (score <= 4) return { level: 2, label: '中', color: '#f59e0b' }
  if (score <= 5) return { level: 3, label: '强', color: '#10b981' }
  return { level: 4, label: '极强', color: '#059669' }
}

const filterPool = (value: string, excludeAmbiguous: boolean) =>
  excludeAmbiguous ? value.split('').filter((char) => !AMBIGUOUS.has(char)).join('') : value

export function estimateEntropy(cfg: Config): number {
  const poolSize = Object.entries(CHAR_SETS)
    .filter(([key]) => cfg[key as keyof typeof CHAR_SETS])
    .reduce((total, [, chars]) => total + filterPool(chars, cfg.excludeAmbiguous).length, 0)

  return poolSize > 0 ? cfg.length * Math.log2(poolSize) : 0
}

export function generatePassword(cfg: Config): string {
  const filter = (s: string) =>
    filterPool(s, cfg.excludeAmbiguous)

  const pools: string[] = []
  if (cfg.upper) pools.push(filter(CHAR_SETS.upper))
  if (cfg.lower) pools.push(filter(CHAR_SETS.lower))
  if (cfg.digits) pools.push(filter(CHAR_SETS.digits))
  if (cfg.symbols) pools.push(filter(CHAR_SETS.symbols))

  const activePools = pools.filter((p) => p.length > 0)
  if (activePools.length === 0) return ''
  const chars = activePools.join('')

  // Guarantee at least one character from each active pool
  const mandatory = activePools.map((pool) => pool[randomIndex(pool.length)])

  // Fill the rest with rejection-sampled random characters
  const rest = Array.from({ length: cfg.length - mandatory.length }, () =>
    chars[randomIndex(chars.length)]
  )

  // Shuffle mandatory + rest together (Fisher-Yates)
  const result = [...mandatory, ...rest]
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result.join('')
}

function generatePasswords(cfg: Config): string[] {
  return Array.from({ length: cfg.count }, () => generatePassword(cfg))
}

export function PasswordApp() {
  const [cfg, setCfg] = useState<Config>(DEFAULT_CONFIG)
  const [passwords, setPasswords] = useState<string[]>([])
  const [copied, setCopied] = useState<number | null>(null)
  const [copyError, setCopyError] = useState(false)

  const generate = useCallback(() => {
    setPasswords(generatePasswords(cfg))
    setCopied(null)
  }, [cfg])

  useEffect(() => {
    generate()
  }, [cfg])

  const copyPassword = async (pw: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(pw)
      setCopied(idx)
      setCopyError(false)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      setCopyError(true)
      setTimeout(() => setCopyError(false), 2000)
    }
  }

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(passwords.join('\n'))
      setCopied(-1)
      setCopyError(false)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      setCopyError(true)
      setTimeout(() => setCopyError(false), 2000)
    }
  }

  const update = (patch: Partial<Config>) => {
    setCfg((prev) => {
      const next = { ...prev, ...patch }
      // Ensure at least one charset
      const anyActive = next.upper || next.lower || next.digits || next.symbols
      if (!anyActive) return prev
      return next
    })
  }

  const strength = passwords[0] ? getStrength(passwords[0]) : null
  const entropy = estimateEntropy(cfg)

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header__title">
          <span className="eyebrow">tools.tf</span>
          <h1 className="page-header__name">密码生成器</h1>
        </div>
        <p className="page-header__desc">在浏览器本地生成安全随机密码，不经过任何服务器</p>
      </header>

      <div className="layout">
        {/* Left Panel */}
        <aside className="panel">
          {/* Length */}
          <section className="section">
            <label className="field-label">
              密码长度 <span className="field-label-value">{cfg.length} 位</span>
            </label>
            <input
              type="range"
              className="slider"
              min={4}
              max={64}
              step={1}
              value={cfg.length}
              onChange={(e) => update({ length: Number(e.target.value) })}
            />
            <div className="slider-hints">
              <span>4</span>
              <span>64</span>
            </div>
          </section>

          {/* Charset */}
          <section className="section">
            <label className="field-label">字符类型</label>
            <div className="toggle-group">
              <label className="toggle-item">
                <input
                  type="checkbox"
                  checked={cfg.upper}
                  onChange={(e) => update({ upper: e.target.checked })}
                />
                <span className="toggle-label">大写字母</span>
                <span className="toggle-example">A–Z</span>
              </label>
              <label className="toggle-item">
                <input
                  type="checkbox"
                  checked={cfg.lower}
                  onChange={(e) => update({ lower: e.target.checked })}
                />
                <span className="toggle-label">小写字母</span>
                <span className="toggle-example">a–z</span>
              </label>
              <label className="toggle-item">
                <input
                  type="checkbox"
                  checked={cfg.digits}
                  onChange={(e) => update({ digits: e.target.checked })}
                />
                <span className="toggle-label">数字</span>
                <span className="toggle-example">0–9</span>
              </label>
              <label className="toggle-item">
                <input
                  type="checkbox"
                  checked={cfg.symbols}
                  onChange={(e) => update({ symbols: e.target.checked })}
                />
                <span className="toggle-label">特殊符号</span>
                <span className="toggle-example">!@#…</span>
              </label>
              <label className="toggle-item toggle-item--divider">
                <input
                  type="checkbox"
                  checked={cfg.excludeAmbiguous}
                  onChange={(e) => update({ excludeAmbiguous: e.target.checked })}
                />
                <span className="toggle-label">排除易混淆字符</span>
                <span className="toggle-example">0Ol1I…</span>
              </label>
            </div>
          </section>

          {/* Count */}
          <section className="section">
            <label className="field-label">
              生成数量 <span className="field-label-value">{cfg.count} 个</span>
            </label>
            <input
              type="range"
              className="slider"
              min={1}
              max={20}
              step={1}
              value={cfg.count}
              onChange={(e) => update({ count: Number(e.target.value) })}
            />
            <div className="slider-hints">
              <span>1</span>
              <span>20</span>
            </div>
          </section>

          {/* Regenerate */}
          <section className="section section--action">
            <button className="regenerate-btn" onClick={generate}>
              重新生成
            </button>
          </section>
        </aside>

        {/* Right Preview */}
        <main className="preview-area">
          {/* Strength */}
          {strength && passwords.length === 1 && (
            <div className="strength-bar-wrap">
              <div className="strength-bar">
                <div
                  className="strength-bar__fill"
                  style={{
                    width: `${(strength.level / 4) * 100}%`,
                    background: strength.color,
                  }}
                />
              </div>
              <span className="strength-label" style={{ color: strength.color }}>
                {strength.label} · {Math.floor(entropy)} bits
              </span>
            </div>
          )}

          {/* Password list */}
          <ul className="password-list">
            {passwords.map((pw, i) => (
              <li key={i} className="password-item">
                <span className="password-text">{pw}</span>
                <button
                  className={`copy-btn${copied === i ? ' copied' : ''}`}
                  onClick={() => copyPassword(pw, i)}
                >
                  {copied === i ? '已复制' : '复制'}
                </button>
              </li>
            ))}
          </ul>

          {cfg.count > 1 && (
            <button
              className={`copy-all-btn${copied === -1 ? ' copied' : ''}`}
              onClick={copyAll}
            >
              {copied === -1 ? '已全部复制' : '复制全部'}
            </button>
          )}

          <p className={copyError ? 'hint-text hint-text--error' : 'hint-text'} aria-live="polite">
            {copyError ? '复制失败，请手动选择密码' : '密码在您的浏览器中生成，不会上传至任何服务器'}
          </p>
        </main>
      </div>
    </div>
  )
}
