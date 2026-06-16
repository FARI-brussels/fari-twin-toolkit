import { MaxToolRoundsError } from './errors'
import type { LlmProvider } from './provider'
import { ToolRegistry } from './tool'
import type {
  AssistantHistoryMessage,
  AssistantMessage,
  Message,
  ToolCall,
  ToolResultMessage,
} from './types'

export interface ConversationOptions {
  provider: LlmProvider
  /** A registry, or just a list of tools (a registry is built internally). */
  tools?: ToolRegistry | import('./tool').ToolDef[]
  /** System prompt forwarded with every chat() call. */
  system?: string
  /** Safety cap on tool-use rounds within one send(). Default 6. */
  maxToolRounds?: number
  /** Observability hooks. */
  onToolCall?: (call: ToolCall, result: unknown, isError: boolean) => void
  onAssistant?: (assistant: AssistantMessage) => void
}

/**
 * One running chat with an LLM. Handles the tool-use loop: send → if the model
 * asks for tools, run them, push results, ask again, repeat. Returns the model's
 * final text message.
 */
export class Conversation {
  readonly messages: Message[] = []
  private readonly registry: ToolRegistry
  private readonly maxRounds: number

  constructor(private readonly options: ConversationOptions) {
    this.registry =
      options.tools instanceof ToolRegistry ? options.tools : new ToolRegistry(options.tools ?? [])
    this.maxRounds = options.maxToolRounds ?? 6
  }

  /** Replace history (useful for restoring a saved session). */
  reset(messages: Message[] = []): void {
    this.messages.length = 0
    this.messages.push(...messages)
  }

  async send(userText: string): Promise<AssistantMessage> {
    this.messages.push({ role: 'user', content: userText })
    let rounds = 0

    while (true) {
      const reply = await this.options.provider.chat({
        messages: this.messages,
        tools: this.registry.list(),
        system: this.options.system,
      })

      const historyEntry: AssistantHistoryMessage = {
        role: 'assistant',
        content: reply.text,
        ...(reply.toolCalls?.length ? { toolCalls: reply.toolCalls } : {}),
      }
      this.messages.push(historyEntry)
      this.options.onAssistant?.(reply)

      if (!reply.toolCalls?.length) return reply

      // Dispatch every requested tool, pushing a result message for each.
      for (const call of reply.toolCalls) {
        let result: unknown
        let isError = false
        try {
          result = await this.registry.call(call.name, call.input)
        } catch (err) {
          isError = true
          result = { error: err instanceof Error ? err.message : String(err) }
        }
        const resultMessage: ToolResultMessage = {
          role: 'tool',
          toolCallId: call.id,
          name: call.name,
          content: typeof result === 'string' ? result : JSON.stringify(result ?? null),
          ...(isError ? { isError: true } : {}),
        }
        this.messages.push(resultMessage)
        this.options.onToolCall?.(call, result, isError)
      }

      rounds++
      if (rounds > this.maxRounds) throw new MaxToolRoundsError(this.maxRounds)
    }
  }
}
