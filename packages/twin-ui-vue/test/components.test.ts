import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref, nextTick, h } from 'vue'
import { FButton, FSwitch, FSlider, FYearSlider, FChoroplethLegend } from '../src/index'

describe('FButton', () => {
  it('renders slot content and forwards native click', async () => {
    const onClick = (() => {
      let n = 0
      const fn = () => {
        n++
      }
      return Object.assign(fn, { count: () => n })
    })()
    const w = mount(FButton, { slots: { default: 'Save' }, attrs: { onClick } })
    expect(w.text()).toBe('Save')
    await w.find('button').trigger('click')
    expect(onClick.count()).toBe(1)
  })

  it('is disabled when loading and shows a spinner', () => {
    const w = mount(FButton, { props: { loading: true } })
    const btn = w.find('button')
    expect(btn.attributes('disabled')).toBeDefined()
    expect(btn.attributes('aria-busy')).toBe('true')
    expect(w.find('.f-btn__spinner').exists()).toBe(true)
  })
})

describe('FSwitch', () => {
  it('toggles via click and updates v-model', async () => {
    const Host = defineComponent({
      components: { FSwitch },
      setup() {
        const v = ref(false)
        return { v }
      },
      template: '<FSwitch v-model="v" label="Notifications" />',
    })
    const w = mount(Host)
    const btn = w.find('button')
    expect(btn.attributes('role')).toBe('switch')
    expect(btn.attributes('aria-checked')).toBe('false')
    await btn.trigger('click')
    expect(btn.attributes('aria-checked')).toBe('true')
    expect((w.vm as unknown as { v: boolean }).v).toBe(true)
  })
})

describe('FSlider', () => {
  it('updates v-model on input', async () => {
    const Host = defineComponent({
      components: { FSlider },
      setup() {
        const v = ref(10)
        return { v }
      },
      template: '<FSlider v-model="v" :min="0" :max="100" :step="1" aria-label="x" />',
    })
    const w = mount(Host)
    const input = w.find('input[type=range]')
    expect(input.exists()).toBe(true)
    ;(input.element as HTMLInputElement).value = '42'
    await input.trigger('input')
    expect((w.vm as unknown as { v: number }).v).toBe(42)
  })
})

describe('FYearSlider', () => {
  it('shows the current year and forwards v-model', async () => {
    const Host = defineComponent({
      components: { FYearSlider },
      setup() {
        const y = ref(2010)
        return { y }
      },
      template: '<FYearSlider v-model="y" :min-year="2000" :max-year="2025" />',
    })
    const w = mount(Host)
    expect(w.text()).toContain('2010')
    expect(w.text()).toContain('2000')
    expect(w.text()).toContain('2025')
    const input = w.find('input[type=range]')
    ;(input.element as HTMLInputElement).value = '2024'
    await input.trigger('input')
    await nextTick()
    expect((w.vm as unknown as { y: number }).y).toBe(2024)
  })
})

describe('FChoroplethLegend', () => {
  it('renders a linear-gradient from stops, with ticks', () => {
    const w = mount(FChoroplethLegend, {
      props: {
        title: 'Unemployment',
        unit: '%',
        stops: [
          { value: 5, color: '#64D8BF' },
          { value: 20, color: '#B32A2D' },
        ],
      },
    })
    expect(w.text()).toContain('Unemployment')
    expect(w.text()).toContain('(%)')
    expect(w.text()).toContain('5')
    expect(w.text()).toContain('20')
    expect(w.find('.f-legend__bar').attributes('style')).toContain('linear-gradient')
  })
})

// suppress unused-import warning for h in some setups
void h
