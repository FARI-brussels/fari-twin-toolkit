import { describe, it, expect } from 'vitest'
import { ToolRegistry } from '../src/tool'
import { ToolNotFoundError } from '../src/errors'

describe('ToolRegistry', () => {
  it('registers, lists, and gets tools', () => {
    const r = new ToolRegistry([
      {
        name: 'a',
        description: 'A',
        inputSchema: { type: 'object' },
        handler: () => 1,
      },
    ])
    r.register({
      name: 'b',
      description: 'B',
      inputSchema: { type: 'object' },
      handler: () => 2,
    })
    expect(r.has('a')).toBe(true)
    expect(
      r
        .list()
        .map((t) => t.name)
        .sort(),
    ).toEqual(['a', 'b'])
  })

  it('calls a tool by name with parsed input', async () => {
    const r = new ToolRegistry([
      {
        name: 'add',
        description: 'add',
        inputSchema: { type: 'object' },
        handler: (input) => {
          const { a, b } = input as { a: number; b: number }
          return a + b
        },
      },
    ])
    expect(await r.call('add', { a: 2, b: 3 })).toBe(5)
  })

  it('throws ToolNotFoundError for unknown tools', async () => {
    const r = new ToolRegistry()
    await expect(r.call('missing', {})).rejects.toBeInstanceOf(ToolNotFoundError)
  })
})
