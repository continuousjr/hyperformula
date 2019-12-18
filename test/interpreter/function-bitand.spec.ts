import {CellError, HyperFormula} from '../../src'
import {CellValueType, ErrorType} from '../../src/Cell'
import {adr} from '../testUtils'

describe('function BITAND', () => {
  it('should not work for wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=BITAND(101)'],
      ['=BITAND(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqual(new CellError(ErrorType.NA))
  })

  it('should not work for arguemnts of wrong type', () => {
    const engine = HyperFormula.buildFromArray([
      ['=BITAND(1, "foo")'],
      ['=BITAND("bar", 4)'],
      ['=BITAND("foo", "baz")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A2'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A3'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('should not work for negative numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=BITAND(1, -2)'],
      ['=BITAND(-1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NUM))
    expect(engine.getCellValue(adr('A2'))).toEqual(new CellError(ErrorType.NUM))
  })

  it('should not work for non-integers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=BITAND(1.2, 2)'],
      ['=BITAND(3.14, 5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NUM))
    expect(engine.getCellValue(adr('A2'))).toEqual(new CellError(ErrorType.NUM))
  })

  it('should work', () => {
    const engine = HyperFormula.buildFromArray([
      ['=BITAND(1, 5)'],
      ['=BITAND(457, 111)'],
      ['=BITAND(BIN2DEC(101), BIN2DEC(1))'],
      ['=BITAND(256, 123)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(73)
    expect(engine.getCellValue(adr('A3'))).toEqual(1)
    expect(engine.getCellValue(adr('A4'))).toEqual(0)
  })

  it('should return numeric type', () => {
    const engine = HyperFormula.buildFromArray([
      ['=BITAND(1, 5)'],
    ])

    expect(engine.getCellValueType(adr('A1'))).toEqual(CellValueType.NUMBER)
  })
})
