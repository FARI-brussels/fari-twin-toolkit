import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { readExcelTable } from '../src/excel'

function workbookBuffer(rows: unknown[][]): Uint8Array {
  const ws = XLSX.utils.aoa_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as Uint8Array
}

describe('readExcelTable', () => {
  it('reads a header row into keyed objects (from a buffer)', () => {
    const buf = workbookBuffer([
      ['code', 'value'],
      ['21004', 12.5],
      ['21001', 9],
    ])
    const rows = readExcelTable(buf)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({ code: '21004', value: 12.5 })
    expect(rows[1]).toEqual({ code: '21001', value: 9 })
  })
})
