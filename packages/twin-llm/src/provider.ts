import type { AssistantMessage, Message } from './types'
import type { ToolDef } from './tool'

export interface ChatOptions {
  messages: Message[]
  tools?: ToolDef[]
  system?: string
}

/**
 * What every provider adapter implements. Translation between this lean shape
 * and the underlying SDK's format (Anthropic blocks, OpenAI deltas, ...) lives
 * inside the adapter. See README for a reference Anthropic adapter (~25 lines).
 */
export interface LlmProvider {
  readonly name: string
  chat(options: ChatOptions): Promise<AssistantMessage>
}
