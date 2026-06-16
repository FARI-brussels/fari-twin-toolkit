/** Minimal typed event emitter keyed by an event map (no index signature required). */
export class Emitter<Events> {
  private handlers: { [K in keyof Events]?: Set<(payload: Events[K]) => void> } = {}

  on<K extends keyof Events>(event: K, handler: (payload: Events[K]) => void): () => void {
    const set = (this.handlers[event] ??= new Set())
    set.add(handler)
    return () => {
      this.handlers[event]?.delete(handler)
    }
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.handlers[event]?.forEach((h) => h(payload))
  }

  clear(): void {
    this.handlers = {}
  }
}
