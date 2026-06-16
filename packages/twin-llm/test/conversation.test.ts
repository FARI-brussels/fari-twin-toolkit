import { describe, it, expect, vi } from 'vitest'
import { Conversation } from '../src/conversation'
import { MockProvider } from '../src/mock-provider'
import { MaxToolRoundsError } from '../src/errors'
import type { ToolDef } from '../src/tool'
import type { AssistantHistoryMessage, AssistantMessage } from '../src/types'

const greetTool: ToolDef = {
  name: 'greet',
  description: 'greet',
  inputSchema: { type: 'object' },
  handler: ({ name }: any) => `hi ${name}`,
}
const failTool: ToolDef = {
  name: 'boom',
  description: 'always fails',
  inputSchema: { type: 'object' },
  handler: () => {
    throw new Error('ouch')
  },
}

describe('Conversation', () => {
  it('returns the assistant text when no tools are requested', async () => {
    const provider = new MockProvider([
      { role: 'assistant', text: 'hello', stopReason: 'end_turn' },
    ])
    const convo = new Conversation({ provider })
    const reply = await convo.send('hi')
    expect(reply.text).toBe('hello')
    expect(convo.messages).toHaveLength(2) // user + assistant
    expect(provider.calls).toHaveLength(1)
  })

  it('dispatches tool calls and feeds the result back to the model', async () => {
    const provider = new MockProvider([
      {
        role: 'assistant',
        text: '',
        toolCalls: [{ id: 't1', name: 'greet', input: { name: 'FARI' } }],
        stopReason: 'tool_use',
      },
      { role: 'assistant', text: 'I greeted them.', stopReason: 'end_turn' },
    ])
    const recorded: { name: string; result: unknown; isError: boolean }[] = []
    const convo = new Conversation({
      provider,
      tools: [greetTool],
      onToolCall: (c, result, isError) => recorded.push({ name: c.name, result, isError }),
    })
    const reply = await convo.send('greet FARI')

    expect(reply.text).toBe('I greeted them.')
    expect(recorded).toEqual([{ name: 'greet', result: 'hi FARI', isError: false }])
    // history: user, assistant(tool_use), tool, assistant(end_turn)
    expect(convo.messages.map((m) => m.role)).toEqual(['user', 'assistant', 'tool', 'assistant'])
    const toolMsg = convo.messages[2] as { role: 'tool'; content: string }
    // String results are passed through verbatim (no JSON-quoting).
    expect(toolMsg.content).toBe('hi FARI')
    // second chat() saw the tool result in history
    expect(provider.calls).toHaveLength(2)
    expect(provider.calls[1]!.messages.some((m) => m.role === 'tool')).toBe(true)
  })

  it('records a tool error without aborting the loop', async () => {
    const provider = new MockProvider([
      {
        role: 'assistant',
        text: '',
        toolCalls: [{ id: 't1', name: 'boom', input: {} }],
        stopReason: 'tool_use',
      },
      { role: 'assistant', text: 'It failed.', stopReason: 'end_turn' },
    ])
    const errors: boolean[] = []
    const convo = new Conversation({
      provider,
      tools: [failTool],
      onToolCall: (_c, _r, isError) => errors.push(isError),
    })
    const reply = await convo.send('boom please')
    expect(errors).toEqual([true])
    expect(reply.text).toBe('It failed.')
    const toolMsg = convo.messages[2] as { isError?: boolean; content: string }
    expect(toolMsg.isError).toBe(true)
    expect(toolMsg.content).toContain('ouch')
  })

  it('aborts after maxToolRounds', async () => {
    const loop: AssistantMessage = {
      role: 'assistant',
      text: '',
      toolCalls: [{ id: 't', name: 'greet', input: { name: 'x' } }],
      stopReason: 'tool_use',
    }
    const provider = new MockProvider([loop, loop, loop, loop])
    const convo = new Conversation({
      provider,
      tools: [greetTool],
      maxToolRounds: 2,
    })
    await expect(convo.send('go')).rejects.toBeInstanceOf(MaxToolRoundsError)
  })

  it('reset() restores history and onAssistant fires once per round', async () => {
    const provider = new MockProvider([{ role: 'assistant', text: 'ok', stopReason: 'end_turn' }])
    const onAssistant = vi.fn()
    const convo = new Conversation({ provider, onAssistant })
    convo.reset([{ role: 'user', content: 'first' } as const])
    await convo.send('second')
    expect(convo.messages[0]).toMatchObject({ role: 'user', content: 'first' })
    expect(onAssistant).toHaveBeenCalledOnce()
  })

  it('forwards system prompt + tools to the provider', async () => {
    const provider = new MockProvider([{ role: 'assistant', text: '', stopReason: 'end_turn' }])
    const convo = new Conversation({ provider, tools: [greetTool], system: 'be terse' })
    await convo.send('hi')
    expect(provider.calls[0]!.system).toBe('be terse')
    expect(provider.calls[0]!.tools?.map((t) => t.name)).toEqual(['greet'])
  })

  it('attaches toolCalls to the assistant history entry', async () => {
    const provider = new MockProvider([
      {
        role: 'assistant',
        text: '',
        toolCalls: [{ id: 't1', name: 'greet', input: { name: 'FARI' } }],
        stopReason: 'tool_use',
      },
      { role: 'assistant', text: 'done', stopReason: 'end_turn' },
    ])
    const convo = new Conversation({ provider, tools: [greetTool] })
    await convo.send('go')
    const assistantTurn = convo.messages[1] as AssistantHistoryMessage
    expect(assistantTurn.toolCalls?.[0]?.name).toBe('greet')
  })
})
