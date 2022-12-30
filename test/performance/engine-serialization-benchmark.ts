import { batch, benchmarkEngineSerialization, BenchmarkResult } from './benchmark'
import { expectedValues as expectedValuesT, sheet as sheetTGenerator } from './sheets/05-sheet-t'
import { expectedValues as expectedValuesA, sheet as sheetAGenerator } from './sheets/09-sheet-a'
import { expectedValues as expectedValuesB, sheet as sheetBGenerator } from './sheets/10-sheet-b'
import { sheet as columnRangesGenerator } from './sheets/column-ranges'

export function runEngineSerializationBenchmark(): BenchmarkResult[] {
  const sheetA = sheetAGenerator()
  const sheetB = sheetBGenerator()
  const sheetT = sheetTGenerator()
  const infiniteRanges = columnRangesGenerator()

  const result: BenchmarkResult[] = []
  batch(result,
    () => benchmarkEngineSerialization('Serialization: Sheet A', sheetA, expectedValuesA(sheetA), {numberOfRuns: 10}),
    () => benchmarkEngineSerialization('Serialization: Sheet B', sheetB, expectedValuesB(sheetB), {numberOfRuns: 10}),
    () => benchmarkEngineSerialization('Serialization: Sheet T', sheetT, expectedValuesT(sheetT), {numberOfRuns: 10}),
    () => benchmarkEngineSerialization('Serialization: Column Ranges', infiniteRanges, [{
      address: 'AX50',
      value: 1.04519967355127e+63
    }], {numberOfRuns: 10}),
  )

  return result
}
