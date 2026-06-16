import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { IconUp, IconSun } from '../src/generated/icons'
import { FariIcon } from '../src/fari-icon'
import { icons, iconNames } from '../src/generated/registry'

describe('generated icon components', () => {
  it('renders an SVG with a viewBox and the requested size', () => {
    const wrapper = mount(IconUp, { props: { size: 32 } })
    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('width')).toBe('32')
    expect(wrapper.html().toLowerCase()).toContain('viewbox')
  })

  it('uses currentColor so it inherits text color', () => {
    expect(mount(IconUp).html()).toContain('currentColor')
    expect(mount(IconSun).html()).toContain('currentColor')
  })

  it('is aria-hidden without a title, labelled with one', () => {
    expect(mount(IconUp).find('svg').attributes('aria-hidden')).toBe('true')
    const labelled = mount(IconUp, { props: { title: 'Scroll up' } })
    expect(labelled.find('svg').attributes('aria-label')).toBe('Scroll up')
    expect(labelled.find('svg').attributes('role')).toBe('img')
  })
})

describe('FariIcon (dynamic) + registry', () => {
  it('renders an icon by name', () => {
    expect(
      mount(FariIcon, { props: { name: 'up' } })
        .find('svg')
        .exists(),
    ).toBe(true)
  })

  it('registers all 59 icons including both variants', () => {
    expect(iconNames).toHaveLength(59)
    expect(icons).toHaveProperty('up')
    expect(icons).toHaveProperty('up-black')
    expect(icons).toHaveProperty('sun')
  })
})
