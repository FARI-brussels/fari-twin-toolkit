import { describe, it, expect } from 'vitest'
import { tokens, brandColors, mainGradients, toCssLinearGradient } from '../src/index'

const HEX = /^#[0-9A-Fa-f]{6}$/

describe('brand colors', () => {
  it('match the brand book exactly', () => {
    expect(brandColors.blue).toBe('#183E91')
    expect(brandColors.webBlue).toBe('#2E4FBF')
    expect(brandColors.lighthouseBlue).toBe('#64D8BF')
  })

  it('are all valid 6-digit hex', () => {
    const groups = [
      tokens.brandColors,
      tokens.neutralColors,
      tokens.accentColors,
      tokens.statusColors,
    ]
    for (const group of groups) {
      for (const value of Object.values(group)) expect(value).toMatch(HEX)
    }
  })
})

describe('toCssLinearGradient', () => {
  it('renders stops in order with default angle', () => {
    expect(toCssLinearGradient(mainGradients.g2)).toBe(
      'linear-gradient(90deg, #A6F3E8 0%, #00DCBE 100%)',
    )
  })

  it('accepts a custom angle', () => {
    expect(toCssLinearGradient(mainGradients.g2, '180deg')).toContain('180deg')
  })
})

describe('type scale', () => {
  it('is monotonically descending in px (display -> micro)', () => {
    const px = Object.values(tokens.fontSizes).map((s) => s.px)
    const descending = [...px].sort((a, b) => b - a)
    expect(px).toEqual(descending)
  })
})
