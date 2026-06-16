# @fari-brussels/twin-llm

Provider-agnostic LLM tool-call layer for FARI digital twins.

Lets an LLM drive the twin: the user types in natural language (or drops a
document), the model calls tools that update indicators / years / scenarios /
viewer state, and the result is reflected on screen. No SDK is forced — pick
your provider, plug it in.

```
user text ─▶ Conversation ─▶ provider.chat({messages, tools}) ─▶ AssistantMessage
                  ▲                                                 │
                  └──── tool result(s) ◀── ToolRegistry.call() ◀────┘   (tool_use loop)
```

## Install

```bash
pnpm add @fari-brussels/twin-llm @fari-brussels/twin-types
```

## Core API

```ts
import {
  Conversation,
  MockProvider,
  ToolRegistry,
  setActiveIndicatorTool,
  applyOverridesTool,
  predictIndicatorTool,
} from '@fari-brussels/twin-llm'

const tools = new ToolRegistry([
  setActiveIndicatorTool((i) => (state.indicator = i.indicator_key)),
  applyOverridesTool(({ overrides }) => state.scenario.set(overrides)),
  predictIndicatorTool(async (req) => engine.predictIndicator(req)),
])

const convo = new Conversation({
  provider: myAnthropicProvider,
  tools,
  system:
    'You are an analyst for the Brussels socio-economic twin. Use the tools to update the map.',
})

const reply = await convo.send('Show unemployment for 2024 and what if it rose to 20 in Bruxelles')
console.log(reply.text)
```

- **`ToolRegistry`** — register tools (`ToolDef = { name, description, inputSchema, handler }`).
- **`Conversation.send(text)`** — runs the full tool-use loop (call the model, dispatch tools, feed results back, repeat) until the model returns a final text answer. Safety cap via `maxToolRounds` (default 6).
- **Hooks**: `onAssistant`, `onToolCall(call, result, isError)` for UI feedback.
- **`reset(messages?)`** restores a saved session.

## Pre-built tool builders

Wired to the rest of the toolkit (the user-facing names are snake_case so LLM
transcripts read naturally):

| Tool                       | Calls into                              |
| -------------------------- | --------------------------------------- |
| `set_active_indicator`     | your reactive state                     |
| `set_active_year`          | your reactive state                     |
| `set_active_place`         | your reactive state                     |
| `fly_to`                   | `viewer-core` (`flyTo`)                 |
| `apply_scenario_overrides` | `scenario-engine` (`ScenarioState.set`) |
| `predict_indicator`        | `scenario-engine` (`predictIndicator`)  |

Each builder takes the host app's handler and returns a typed `ToolDef`.

## Document extractor

For "drop a PDF into the chat" workflows:

```ts
import { ExtractorChain, TextDocumentExtractor } from '@fari-brussels/twin-llm'
const chain = new ExtractorChain([new TextDocumentExtractor() /*, new MyPdfExtractor() */])
const { text } = await chain.extract(file)
await convo.send(`From this document, extract scenario overrides:\n\n${text}`)
```

The package ships the contract + a plain-text extractor. PDF/docx parsers
(pdf.js, mammoth, ...) stay app-side so this package stays small.

## Wiring a real provider

The package gives you `LlmProvider`; you implement `chat()`. A minimal Anthropic
adapter (~25 lines):

```ts
import Anthropic from '@anthropic-ai/sdk'
import type { LlmProvider, ChatOptions, AssistantMessage } from '@fari-brussels/twin-llm'

export class AnthropicProvider implements LlmProvider {
  readonly name = 'anthropic'
  constructor(
    private client: Anthropic,
    private model = 'claude-sonnet-4-5',
  ) {}

  async chat(opts: ChatOptions): Promise<AssistantMessage> {
    const res = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: opts.system,
      tools: opts.tools?.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
      })),
      messages: opts.messages.map((m) => /* translate Message -> Anthropic message */ ({
        /* ... */
      })) as Anthropic.MessageParam[],
    })
    const text = res.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
    const toolCalls = res.content
      .filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
      .map((b) => ({ id: b.id, name: b.name, input: b.input }))
    return {
      role: 'assistant',
      text,
      toolCalls: toolCalls.length ? toolCalls : undefined,
      stopReason: res.stop_reason === 'tool_use' ? 'tool_use' : 'end_turn',
    }
  }
}
```

Use **prompt caching** (`cache_control`) on long system prompts / tool definitions
when you actually run this in production — see the
[Anthropic prompt caching docs](https://docs.claude.com/en/docs/build-with-claude/prompt-caching).

## Test

```bash
pnpm --filter @fari-brussels/twin-llm test
```

Tested with `MockProvider` (deterministic, no API key): text-only replies,
single tool round-trip, multi-round loops, max-rounds cap, tool errors,
history/`reset()`, system prompt + tools forwarded. Plus the document
extractor and every domain tool builder.
