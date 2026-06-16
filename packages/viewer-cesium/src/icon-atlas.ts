/**
 * Generates and caches small marker images (as data URLs) for realtime
 * billboards. Pure `<canvas>` — no Cesium, no framework — so the same atlas can
 * back any renderer that draws image markers.
 *
 * Two primitives, both expensive enough to be worth caching:
 * - **Emoji icons** — an emoji glyph rasterized to a transparent square, keyed
 *   by `emoji:size`. Used for vehicle/aircraft markers.
 * - **A shared circle** — one white disc reused for every point marker; the
 *   per-feature color is applied as a billboard tint, so thousands of points
 *   share a single texture.
 */
export class IconAtlasManager {
  private emojiCanvas: HTMLCanvasElement | null = null
  private circleCanvas: HTMLCanvasElement | null = null
  private readonly emojiCache = new Map<string, string>()
  private sharedCircleUrl: string | null = null

  /** Rasterize an emoji to a `size`×`size` data URL (cached by glyph + size). */
  createEmojiIcon(emoji: string, size = 128): string {
    const key = `${emoji}:${size}`
    const cached = this.emojiCache.get(key)
    if (cached) return cached

    if (!this.emojiCanvas) this.emojiCanvas = document.createElement('canvas')
    this.emojiCanvas.width = size
    this.emojiCanvas.height = size
    const ctx = this.emojiCanvas.getContext('2d', { willReadFrequently: false })
    if (!ctx) return ''

    ctx.clearRect(0, 0, size, size)
    ctx.font = `bold ${size * 0.78}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(emoji, size / 2, size / 2 + 4)

    const dataUrl = this.emojiCanvas.toDataURL()
    this.emojiCache.set(key, dataUrl)
    return dataUrl
  }

  /** A single white disc data URL, reused (and tinted) for all point markers. */
  createSharedCircle(radius = 14, strokeWidth = 4): string {
    if (this.sharedCircleUrl) return this.sharedCircleUrl

    if (!this.circleCanvas) this.circleCanvas = document.createElement('canvas')
    const size = (radius + strokeWidth) * 2
    this.circleCanvas.width = size
    this.circleCanvas.height = size
    const ctx = this.circleCanvas.getContext('2d', { willReadFrequently: false, alpha: true })
    if (!ctx) return ''

    ctx.clearRect(0, 0, size, size)
    const center = size / 2
    ctx.beginPath()
    ctx.arc(center, center, radius, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()

    this.sharedCircleUrl = this.circleCanvas.toDataURL()
    return this.sharedCircleUrl
  }

  /** Release cached canvases and data URLs. */
  clear(): void {
    this.emojiCache.clear()
    this.emojiCanvas = null
    this.circleCanvas = null
    this.sharedCircleUrl = null
  }
}
