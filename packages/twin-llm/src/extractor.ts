/**
 * Document → LLM-readable text. The contract is intentionally small so apps
 * can plug in PDF/docx parsers (pdf.js, mammoth, …) without this package
 * depending on them. For plain text / CSV / markdown, use TextDocumentExtractor.
 */
export interface ExtractedDocument {
  text: string
  mimeType: string
  filename?: string
}

export interface DocumentExtractor {
  /** True if this extractor can handle the given file. */
  supports(file: Blob | File): boolean
  extract(file: Blob | File): Promise<ExtractedDocument>
}

/** Reads the file as text. Suits text/plain, text/csv, text/markdown, etc. */
export class TextDocumentExtractor implements DocumentExtractor {
  supports(file: Blob | File): boolean {
    const type = (file.type || '').toLowerCase()
    return (
      type === '' ||
      type.startsWith('text/') ||
      type === 'application/json' ||
      type === 'application/xml'
    )
  }

  async extract(file: Blob | File): Promise<ExtractedDocument> {
    return {
      text: await file.text(),
      mimeType: file.type || 'text/plain',
      filename: 'name' in file ? file.name : undefined,
    }
  }
}

/** Try each extractor in order; throws if none supports the file. */
export class ExtractorChain implements DocumentExtractor {
  constructor(private readonly extractors: DocumentExtractor[]) {}

  supports(file: Blob | File): boolean {
    return this.extractors.some((e) => e.supports(file))
  }

  async extract(file: Blob | File): Promise<ExtractedDocument> {
    for (const e of this.extractors) {
      if (e.supports(file)) return e.extract(file)
    }
    throw new Error(`No extractor supports MIME type "${file.type}"`)
  }
}
