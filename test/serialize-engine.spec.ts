import {
  CellError,
  ConfigParams,
  DetailedCellError,
  ErrorType,
  HyperFormula,
  RawCellContent,
  SimpleCellAddress
} from '../src'
import { FormulaCellVertex } from '../src/DependencyGraph'
import { AstNodeType, CellAddress, CellReferenceAst, NumberAst, PlusOpAst, StringAst } from '../src/parser'
import { VertexWithId, VertexWithIdType } from '../src/avro/VertexWithIdType'
import { SimpleCellAddressType } from '../src/avro/SimpleCellAddressType'
import { AvroTypeCreator, SerializationContext } from '../src/avro/SerializationContext'
import { AstType } from '../src/avro/AstType'
import { Config } from '../src/Config'
import { CellReferenceType } from '../src/parser/CellAddress'

describe('Saving and restoring engine state', () => {
  let engine: HyperFormula
  let restoredEngine: HyperFormula

  describe('configuration', () => {
    beforeAll(() => {
      buildEngine({caseFirst: 'upper'})
      serializeAndRestore()
    })

    it('should restore engine configuration', () => {
      expect(restoredEngine.getConfig()).toEqual(engine.getConfig())
    })
  })

  describe('Value cells', () => {
    beforeAll(() => {
      buildEngine()

      setCellContents('A1', 'Hello World')
      setCellContents('B2', 42)
      setCellContents('C2', 25.326)
      setCellContents('D3', true)
      setCellContents('D4', '=badfunc(')
      setCellContents('D5', new Date(2000, 1, 1))

      serializeAndRestore()
    })

    it('should restore a string cell', () => {
      expect(getCellValue('A1')).toEqual('Hello World')
    })

    it('should restore an integer cell', () => {
      expect(getCellValue('B2')).toEqual(42)
    })

    it('should restore a double cell', () => {
      expect(getCellValue('C2')).toEqual(25.326)
    })

    it('should restore a boolean cell', () => {
      expect(getCellValue('D3')).toEqual(true)
    })

    it('should restore an error cell', () => {
      const expectedError = new DetailedCellError(new CellError(ErrorType.ERROR, 'Parsing error.'), '#ERROR!')
      expect(getCellValue('D4')).toEqual(expectedError)
    })

    it('should restore a date cell', () => {
      expect(restoredEngine.getCellSerialized(address('D5'))).toEqual(new Date(2000, 1, 1))
    })
  })

  describe('avro type tests', () => {
    describe('ast tests', () => {
      describe('simple string', () => {
        it('with leading whitespace', () => {
          const ast: StringAst = {type: AstNodeType.STRING, value: 'Hello', leadingWhitespace: '  '}

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })
        it('without leading whitespace', () => {
          const ast: StringAst = {type: AstNodeType.STRING, value: 'Hello'}

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })
      })

      describe('simple number', () => {
        it('with leading whitespace', () => {
          const ast: NumberAst = {type: AstNodeType.NUMBER, value: 25, leadingWhitespace: '  '}

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })
        it('without leading whitespace', () => {
          const ast: NumberAst = {type: AstNodeType.NUMBER, value: 42.35}

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })
      })

      describe('binary operations', () => {
        it('addition of literals', () => {
          const ast: PlusOpAst = {
            type: AstNodeType.PLUS_OP,
            left: {type: AstNodeType.NUMBER, value: 5},
            right: {type: AstNodeType.NUMBER, value: 12}
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })

        it('other binary operations', () => {
          fail('implement me')
        })
      })

      describe('cell reference', () => {
        it('cell reference with no sheet and no whitespace', () => {
          const ast: CellReferenceAst = {
            type: AstNodeType.CELL_REFERENCE,
            reference: new CellAddress(-1, 1, CellReferenceType.CELL_REFERENCE_RELATIVE)
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })

        it('cell reference with whitespace', () => {
          const ast: CellReferenceAst = {
            type: AstNodeType.CELL_REFERENCE,
            reference: new CellAddress(-1, 1, CellReferenceType.CELL_REFERENCE_RELATIVE),
            leadingWhitespace: '  '
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })

        it('cell reference with a specific sheet', () => {
          const ast: CellReferenceAst = {
            type: AstNodeType.CELL_REFERENCE,
            reference: new CellAddress(-1, 1, CellReferenceType.CELL_REFERENCE_RELATIVE, 2)
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })
      })
    })

    it('formula vertex test', () => {
      const cell = new FormulaCellVertex({type: AstNodeType.STRING, value: 'Hello'} as StringAst, {
        row: 0,
        col: 0,
        sheet: 0
      }, 2)
      const cellWithId = cell as VertexWithId
      cellWithId.id = 25

      const restored = serializeAndRestoreItem(VertexWithIdType, cellWithId)
      expect(restored).toEqual(cell)
    })

    it('simple cell address test', () => {
      const addr = {row: 2, col: 5, sheet: 0} as SimpleCellAddress

      const restored = serializeAndRestoreItem(SimpleCellAddressType, addr)
      expect(restored).toEqual(addr)
    })

    function serializeAndRestoreItem<T, I>(type: AvroTypeCreator<T>, item: I): I {
      const outEngine = HyperFormula.buildEmpty()
      const outContext = new SerializationContext(outEngine.lazilyTransformingAstService)
      const buffer = type(outContext).AvroType.toBuffer(item)

      const inEngine = HyperFormula.buildEmpty()
      const inConfig = new Config(inEngine.getConfig())
      const inContext = new SerializationContext(inEngine.lazilyTransformingAstService, inConfig.translationPackage)
      return type(inContext).AvroType.fromBuffer(buffer)
    }
  })

  describe('formula cells', () => {
    beforeAll(() => {
      buildEngine()

      setCellContents('A1', '=5+6')
      setCellContents('B1', '=A1')

      serializeAndRestore()
    })


    it('should restore a simple formula', () => {
      expect(getCellValue('A1')).toEqual(11)
    })

    it('should restore a formula with a relative cell reference', () => {
      expect(getCellValue('B1')).toEqual(11)
    })
  })

  describe('temp -- timing', () => {
    it('all values', () => {
      const engineData = generateEngineData(
        2500,
        100,
        (r, c) => r + c
      )

      const sheets = {
        sheet1: engineData,
        sheet2: engineData,
        sheet3: engineData,
        sheet4: engineData,
      }

      measureTime(sheets, engineData)
    })

    it('all simple formulas', () => {
      const engineData = generateEngineData(
        2500,
        100,
        (r, c) => `=${r}+${c}`
      )

      const sheets = {
        sheet1: engineData,
        sheet2: engineData,
        sheet3: engineData,
        sheet4: engineData,
      }

      measureTime(sheets, engineData)
    })

    it('1/3 value, 1/3 reference, 1/3 simple', () => {
      const engineData = generateEngineData(2500, 100,
        (r, c) => {
          const bucket = c % 3
          if (bucket === 0) {
            return r + c
          } else if (bucket === 1) {
            return `=${r}+${c}`
          } else {
            const addressRow = r + 1
            const addressColLessOne = c - 1
            return `=${addressColLessOne}${addressRow}`;
          }
        }
      )

      const sheets = {
        sheet1: engineData,
        sheet2: engineData,
        sheet3: engineData,
        sheet4: engineData,
      }

      measureTime(sheets, engineData)
    })

    function measureTime(sheets: { sheet3: RawCellContent[][]; sheet4: RawCellContent[][]; sheet1: RawCellContent[][]; sheet2: RawCellContent[][] }, engineData: RawCellContent[][]) {
      let start = Date.now()
      engine = HyperFormula.buildFromSheets(sheets)
      let end = Date.now()


      const buildTime = end - start
      console.log(`Built in ${buildTime} millis`)

      start = Date.now()
      const serialized = HyperFormula.serializeEngine(engine)
      end = Date.now()

      const serializeTime = end - start
      const serializedSize = serialized.length
      console.log(`Serialized in ${serializeTime} millis`)

      start = Date.now()
      restoredEngine = HyperFormula.restoreEngine(serialized)
      end = Date.now()

      const deserializeTime = end - start
      console.log(`Deserialized in ${deserializeTime} millis`)

      const numCells = engineData.length * engineData[0].length * engine.countSheets()
      expect({
        numCells,
        timing: {
          buildTime,
          serializeTime,
          deserializeTime,
        },
        serializedSize,
      }).toEqual({})
    }

    function generateEngineData(rows: number, cols: number, valueGenerator: (row: number, col: number) => RawCellContent) {
      const engineData: RawCellContent[][] = []
      for (let i = 0; i < rows; i++) {
        engineData[i] = []
        for (let j = 0; j < cols; j++) {
          engineData[i][j] = valueGenerator(i, j)
        }
      }

      return engineData
    }
  })

  function buildEngine(config: Partial<ConfigParams> = {}) {
    engine = HyperFormula.buildEmpty(config)
    engine.addSheet('Sheet 1')
  }

  function serializeAndRestore() {
    restoredEngine = HyperFormula.restoreEngine(HyperFormula.serializeEngine(engine))
  }

  function address(range: string, sheet = 0) {
    return engine.simpleCellAddressFromString(range, sheet)!
  }

  function setCellContents(range: string, cellContents: RawCellContent[][] | RawCellContent) {
    engine.setCellContents(address(range), cellContents)
  }

  function setCellContentsForSheet(sheetId: number, range: string, cellContents: RawCellContent[][] | RawCellContent) {
    engine.setCellContents(address(range, sheetId), cellContents)
  }

  function getCellValue(range: string, sheetId = 0) {
    return restoredEngine.getCellValue(address(range, sheetId))
  }
})
