import { defineComponent, h, type PropType } from 'vue'

/**
 * Build a tree-shakeable SVG icon component from a viewBox + inner markup.
 * Pass `size` (px or any CSS length) and optional `title` (sets role/aria-label;
 * otherwise the icon is aria-hidden). Style the color via CSS `color`.
 */
export function makeIcon(name: string, viewBox: string, inner: string) {
  return defineComponent({
    name,
    props: {
      size: { type: [Number, String] as PropType<number | string>, default: 24 },
      title: { type: String, default: undefined },
    },
    setup(props, { attrs }) {
      return () =>
        h('svg', {
          xmlns: 'http://www.w3.org/2000/svg',
          width: props.size,
          height: props.size,
          viewBox,
          fill: 'none',
          role: props.title ? 'img' : undefined,
          'aria-hidden': props.title ? undefined : 'true',
          'aria-label': props.title,
          innerHTML: inner,
          ...attrs,
        })
    },
  })
}
