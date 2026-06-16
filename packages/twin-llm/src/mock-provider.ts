import type { AssistantMessage } from './types'
import type { ChatOptions, LlmProvider } from './provider'

/**
 * Provider that returns a pre-scripted sequence of AssistantMessages and
 * records every chat() call for inspection. Used by Conversation tests; useful
 * in app dev when you don't want to burn tokens.
 */
export class MockProvider implements LlmProvider {
  readonly name = 'mock'
  readonly calls: ChatOptions[] = []

  constructor(private readonly script: AssistantMessage[]) {}

  async chat(options: ChatOptions): Promise<AssistantMessage> {
    this.calls.push(options)
    const next = this.script.shift()
    if (!next) throw new Error('MockProvider: script exhausted')
    return next
  }

  get remaining(): number {
    return this.script.length
  }
}
