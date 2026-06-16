export class ToolNotFoundError extends Error {
  readonly toolName: string
  constructor(toolName: string) {
    super(`Tool "${toolName}" is not registered`)
    this.name = 'ToolNotFoundError'
    this.toolName = toolName
  }
}

export class MaxToolRoundsError extends Error {
  readonly rounds: number
  constructor(rounds: number) {
    super(`Exceeded maximum tool-call rounds (${rounds})`)
    this.name = 'MaxToolRoundsError'
    this.rounds = rounds
  }
}

export class ProviderError extends Error {
  readonly providerCause?: unknown
  constructor(message: string, providerCause?: unknown) {
    super(message)
    this.name = 'ProviderError'
    this.providerCause = providerCause
  }
}
