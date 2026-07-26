import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, estimateEntropy, generatePassword, type Config } from './App'

describe('password generation', () => {
  it('uses the configured length and every selected character class', () => {
    const config: Config = {
      ...DEFAULT_CONFIG,
      length: 32,
      symbols: true,
      excludeAmbiguous: false,
    }

    for (let iteration = 0; iteration < 20; iteration += 1) {
      const password = generatePassword(config)
      expect(password).toHaveLength(32)
      expect(password).toMatch(/[A-Z]/)
      expect(password).toMatch(/[a-z]/)
      expect(password).toMatch(/[0-9]/)
      expect(password).toMatch(/[^A-Za-z0-9]/)
    }
  })

  it('excludes ambiguous characters when requested', () => {
    const config: Config = { ...DEFAULT_CONFIG, length: 64, count: 1 }
    expect(generatePassword(config)).not.toMatch(/[0O1lI2Z5S6b8B]/)
  })

  it('reports entropy from the active pool and length', () => {
    expect(estimateEntropy({ ...DEFAULT_CONFIG, length: 20 })).toBeGreaterThan(
      estimateEntropy({ ...DEFAULT_CONFIG, length: 10 }),
    )
  })
})
