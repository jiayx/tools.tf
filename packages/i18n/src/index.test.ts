import { describe, expect, it } from 'vitest'
import { localeTag, pick, resolveLocale } from './index'

describe('resolveLocale', () => {
  it('matches Chinese language tags', () => {
    expect(resolveLocale('zh-CN,zh;q=0.9,en;q=0.8')).toBe('zh')
    expect(resolveLocale(['zh-Hant-TW'])).toBe('zh')
  })

  it('respects language quality and order', () => {
    expect(resolveLocale('en-US;q=0.7,zh-CN;q=0.9')).toBe('zh')
    expect(resolveLocale(['en-GB', 'zh-CN'])).toBe('en')
  })

  it('falls back to English for unsupported or missing languages', () => {
    expect(resolveLocale('fr-FR,de;q=0.8')).toBe('en')
    expect(resolveLocale()).toBe('en')
  })
})

describe('locale helpers', () => {
  it('returns the correct language tag and message', () => {
    expect(localeTag('zh')).toBe('zh-CN')
    expect(localeTag('en')).toBe('en')
    expect(pick('zh', { en: 'Hello', zh: '你好' })).toBe('你好')
  })
})
