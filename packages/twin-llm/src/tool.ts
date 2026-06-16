import { ToolNotFoundError } from './errors'
import type { JSONSchema } from './types'

export interface ToolDef<TInput = unknown, TResult = unknown> {
  /** Snake_case-by-convention identifier the model uses to call this tool. */
  name: string
  /** Human-language description shown to the LLM. Tell it *when* to use it. */
  description: string
  /** Argument shape (JSON Schema). The provider adapter forwards this to the SDK. */
  inputSchema: JSONSchema
  /**
   * Run the tool. Receives parsed JSON input; should return any JSON-serializable
   * value (it'll be sent back to the model as the tool result).
   */
  handler: (input: TInput) => Promise<TResult> | TResult
}

/** Typed map of tools the model can call. */
export class ToolRegistry {
  private tools = new Map<string, ToolDef>()

  constructor(initial: ToolDef[] = []) {
    for (const t of initial) this.register(t)
  }

  register(tool: ToolDef): void {
    this.tools.set(tool.name, tool)
  }

  has(name: string): boolean {
    return this.tools.has(name)
  }

  get(name: string): ToolDef | undefined {
    return this.tools.get(name)
  }

  list(): ToolDef[] {
    return [...this.tools.values()]
  }

  async call(name: string, input: unknown): Promise<unknown> {
    const tool = this.tools.get(name)
    if (!tool) throw new ToolNotFoundError(name)
    return await tool.handler(input)
  }
}
