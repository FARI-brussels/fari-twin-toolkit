import { defineComponent, h, type PropType } from 'vue'
import { icons, type IconName } from './generated/registry'

/**
 * Dynamic icon by name — convenient, but pulls the whole set into the bundle.
 * For production, prefer named imports (`import { IconUp } from '@fari-brussels/twin-ui-icons'`).
 */
export const FariIcon = defineComponent({
  name: 'FariIcon',
  props: {
    name: { type: String as PropType<IconName>, required: true },
    size: { type: [Number, String] as PropType<number | string>, default: 24 },
    title: { type: String, default: undefined },
  },
  setup(props, { attrs }) {
    return () => {
      const comp = icons[props.name]
      return comp ? h(comp, { size: props.size, title: props.title, ...attrs }) : null
    }
  },
})
