import { describe, it, expect } from 'vitest'
import { ExtractorChain, TextDocumentExtractor } from '../src/extractor'

describe('TextDocumentExtractor', () => {
  it('reads a text blob to a string', async () => {
    const ex = new TextDocumentExtractor()
    const blob = new Blob(['hello FARI'], { type: 'text/plain' })
    const out = await ex.extract(blob)
    expect(out.text).toBe('hello FARI')
    expect(out.mimeType).toBe('text/plain')
  })

  it('supports text-ish MIME types', () => {
    const ex = new TextDocumentExtractor()
    expect(ex.supports(new Blob(['x'], { type: 'text/csv' }))).toBe(true)
    expect(ex.supports(new Blob(['x'], { type: 'application/json' }))).toBe(true)
    expect(ex.supports(new Blob(['x'], { type: 'application/pdf' }))).toBe(false)
  })
})

describe('ExtractorChain', () => {
  it('dispatches to the first extractor that supports the file', async () => {
    const chain = new ExtractorChain([new TextDocumentExtractor()])
    const out = await chain.extract(new Blob(['x'], { type: 'text/plain' }))
    expect(out.text).toBe('x')
  })

  it('throws when no extractor supports the file', async () => {
    const chain = new ExtractorChain([new TextDocumentExtractor()])
    await expect(
      chain.extract(new Blob([new Uint8Array([1, 2])], { type: 'application/pdf' })),
    ).rejects.toThrow(/No extractor/)
  })
})
