/**
 * Provider-agnostic message + tool-call types. Real SDKs (Anthropic, OpenAI)
 * have richer / nested representations; provider adapters translate to/from
 * this lean shape so the rest of the package (and the host app) stays decoupled.
 */

/** Minimal JSON Schema subset for tool input definitions. */
export interface JSONSchema {
  type?: string
  description?: string
  properties?: Record<string, JSONSchema>
  required?: string[]
  items?: JSONSchema
  enum?: unknown[]
  [key: string]: unknown
}

export interface UserMessage {
  role: 'user'
  content: string
}
export interface SystemMessage {
  role: 'system'
  content: string
}
export interface AssistantHistoryMessage {
  role: 'assistant'
  /** Text the assistant emitted (may be empty if it only requested tools). */
  content: string
  /** Tool calls the assistant requested in this turn, if any. */
  toolCalls?: ToolCall[]
}
export interface ToolResultMessage {
  role: 'tool'
  toolCallId: string
  name: string
  /** JSON-stringified result, or a short string for non-JSON outputs. */
  content: string
  /** Optional: true if the tool errored — providers may render this differently. */
  isError?: boolean
}

export type Message = UserMessage | SystemMessage | AssistantHistoryMessage | ToolResultMessage

export interface ToolCall {
  id: string
  name: string
  /** Parsed JSON arguments — providers should hand back an object, not a string. */
  input: unknown
}

export type StopReason = 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence' | 'other'

export interface AssistantMessage {
  role: 'assistant'
  text: string
  toolCalls?: ToolCall[]
  stopReason: StopReason
}
