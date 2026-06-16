import * as XLSX from 'xlsx'

export type Row = Record<string, unknown>

export interface ReadExcelOptions {
  /** Sheet name; defaults to the first sheet. */
  sheet?: string
  /** A1-style range to restrict parsing (e.g. "A3:F200"). */
  range?: string
}

/**
 * Read a sheet of an .xlsx/.xls workbook into an array of row objects keyed by
 * the header row. Accepts a file path (Node) or an in-memory buffer.
 */
export function readExcelTable(
  input: string | ArrayBuffer | Uint8Array,
  opts: ReadExcelOptions = {},
): Row[] {
  const wb = typeof input === 'string' ? XLSX.readFile(input) : XLSX.read(input, { type: 'array' })
  const sheetName = opts.sheet ?? wb.SheetNames[0]
  if (!sheetName) return []
  const sheet = wb.Sheets[sheetName]
  if (!sheet) return []
  return XLSX.utils.sheet_to_json<Row>(sheet, opts.range ? { range: opts.range } : undefined)
}
