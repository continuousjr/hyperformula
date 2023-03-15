import {
  AlwaysSparse,
  CellError,
  ConfigParams,
  DetailedCellError,
  ErrorType,
  HyperFormula,
  RawCellContent,
  SimpleCellAddress
} from '../src'
import { FormulaCellVertex, ParsingErrorVertex, RangeVertex, Vertex } from '../src/DependencyGraph'
import {
  AstNodeType,
  CellAddress,
  CellRangeAst,
  CellReferenceAst,
  ConcatenateOpAst,
  EqualsOpAst,
  ErrorAst,
  GreaterThanOpAst,
  GreaterThanOrEqualOpAst,
  LessThanOpAst,
  LessThanOrEqualOpAst,
  MinusOpAst,
  NamedExpressionAst,
  NotEqualOpAst,
  NumberAst,
  PlusOpAst,
  PowerOpAst,
  ProcedureAst,
  StringAst
} from '../src/parser'
import { VertexType } from '../src/avro/VertexType'
import { SimpleCellAddressType } from '../src/avro/SimpleCellAddressType'
import { AvroTypeCreator, SerializationContext } from '../src/avro/SerializationContext'
import { AstType } from '../src/avro/AstType'
import { Config } from '../src/Config'
import { CellReferenceType } from '../src/parser/CellAddress'
import { DateNumber } from '../src/interpreter/InterpreterValue'
import { RichNumberType } from '../src/avro/RichNumberType'
import {
  ArrayAst,
  buildNumberAst,
  ColumnRangeAst,
  DivOpAst,
  EmptyArgAst,
  ErrorWithRawInputAst,
  ParenthesisAst,
  ParsingErrorType,
  PercentOpAst,
  RangeSheetReferenceType,
  RowRangeAst,
  TimesOpAst
} from '../src/parser/Ast'
import { RowAddress } from '../src/parser/RowAddress'
import { ColumnAddress, ReferenceType } from '../src/parser/ColumnAddress'
import { simpleCellAddress } from '../src/Cell'
import { AbsoluteCellRange } from '../src/AbsoluteCellRange'
import { FormulaVertex } from '../src/DependencyGraph/FormulaCellVertex'

describe('Saving and restoring engine state', () => {
  let engine: HyperFormula
  let restoredEngine: HyperFormula

  describe('configuration', () => {
    beforeAll(() => {
      buildEngine({
        accentSensitive: true,
        binarySearchThreshold: 21,
        currencySymbol: ['^'],
        caseSensitive: true,
        caseFirst: 'upper',
        chooseAddressMappingPolicy: new AlwaysSparse(),
        dateFormats: ['MM/DD/YYYY', 'MM/DD/YY'],
        decimalSeparator: ',',
        evaluateNullToZero: true,
        excelCompatibleSubtotal: true,
        functionArgSeparator: '.',
        ignorePunctuation: true,
        language: 'enGB',
        ignoreWhiteSpace: 'any',
        leapYear1900: true,
        localeLang: 'fr',
        matchWholeCell: false,
        arrayColumnSeparator: ';',
        arrayRowSeparator: '|',
        maxRows: 40_001,
        maxColumns: 18_271,
        nullYear: 31,
        nullDate: {year: 1898, month: 11, day: 29},
        precisionEpsilon: 1e-12,
        precisionRounding: 13,
        smartRounding: false,
        timeFormats: ['mm:hh', 'mm:hh:ss.sss'],
        thousandSeparator: '',
        undoLimit: 21,
        useRegularExpressions: true,
        useWildcards: false,
        useColumnIndex: true,
        useStats: true,
        useArrayArithmetic: true,
      })

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
      expect(getRestoredValue('A1')).toEqual('Hello World')
    })

    it('should restore an integer cell', () => {
      expect(getRestoredValue('B2')).toEqual(42)
    })

    it('should restore a double cell', () => {
      expect(getRestoredValue('C2')).toEqual(25.326)
    })

    it('should restore a boolean cell', () => {
      expect(getRestoredValue('D3')).toEqual(true)
    })

    it('should restore an error cell', () => {
      const expectedError = new DetailedCellError(new CellError(ErrorType.ERROR, 'Parsing error.'), '#ERROR!')
      expect(getRestoredValue('D4')).toEqual(expectedError)
    })

    it('should restore a date cell', () => {
      expect(restoredEngine.getCellSerialized(address('D5'))).toEqual(new Date(2000, 1, 1))
    })
  })

  describe('avro type tests', () => {
    describe('rich number tests', () => {
      it('DateNumber', () => {
        const richNumber = new DateNumber(new Date().getTime(), 'some format')

        const restored = serializeAndRestoreItem(RichNumberType, richNumber)
        expect(restored).toEqual(richNumber)
      })
    })
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
        it('PlusOp', () => {
          const ast: PlusOpAst = {
            type: AstNodeType.PLUS_OP,
            left: {type: AstNodeType.NUMBER, value: 5},
            right: {type: AstNodeType.NUMBER, value: 12}
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })

        it('MinusOp', () => {
          const ast: MinusOpAst = {
            type: AstNodeType.MINUS_OP,
            left: {type: AstNodeType.NUMBER, value: 5},
            right: {type: AstNodeType.NUMBER, value: 12}
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })

        it('TimesOp', () => {
          const ast: TimesOpAst = {
            type: AstNodeType.TIMES_OP,
            left: {type: AstNodeType.NUMBER, value: 5},
            right: {type: AstNodeType.NUMBER, value: 12}
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })

        it('DivOp', () => {
          const ast: DivOpAst = {
            type: AstNodeType.DIV_OP,
            left: {type: AstNodeType.NUMBER, value: 5},
            right: {type: AstNodeType.NUMBER, value: 12}
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })

        it('Equals', () => {
          const ast: EqualsOpAst = {
            type: AstNodeType.EQUALS_OP,
            left: {type: AstNodeType.NUMBER, value: 5},
            right: {type: AstNodeType.NUMBER, value: 12}
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })

        it('NotEquals', () => {
          const ast: NotEqualOpAst = {
            type: AstNodeType.NOT_EQUAL_OP,
            left: {type: AstNodeType.NUMBER, value: 5},
            right: {type: AstNodeType.NUMBER, value: 12}
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })

        it('GreaterThan', () => {
          const ast: GreaterThanOpAst = {
            type: AstNodeType.GREATER_THAN_OP,
            left: {type: AstNodeType.NUMBER, value: 5},
            right: {type: AstNodeType.NUMBER, value: 12}
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })

        it('GreaterThanOrEqual', () => {
          const ast: GreaterThanOrEqualOpAst = {
            type: AstNodeType.GREATER_THAN_OR_EQUAL_OP,
            left: {type: AstNodeType.NUMBER, value: 5},
            right: {type: AstNodeType.NUMBER, value: 12}
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })

        it('LessThan', () => {
          const ast: LessThanOpAst = {
            type: AstNodeType.LESS_THAN_OP,
            left: {type: AstNodeType.NUMBER, value: 5},
            right: {type: AstNodeType.NUMBER, value: 12}
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })

        it('LessThanOrEqual', () => {
          const ast: LessThanOrEqualOpAst = {
            type: AstNodeType.LESS_THAN_OR_EQUAL_OP,
            left: {type: AstNodeType.NUMBER, value: 5},
            right: {type: AstNodeType.NUMBER, value: 12}
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })

        it('Power', () => {
          const ast: PowerOpAst = {
            type: AstNodeType.POWER_OP,
            left: {type: AstNodeType.NUMBER, value: 5},
            right: {type: AstNodeType.NUMBER, value: 12}
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })

        it('Concatenate', () => {
          const ast: ConcatenateOpAst = {
            type: AstNodeType.CONCATENATE_OP,
            left: {type: AstNodeType.NUMBER, value: 5},
            right: {type: AstNodeType.NUMBER, value: 12}
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
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

      describe('cell range', () => {
        it('cell range', () => {
          const ast: CellRangeAst = {
            type: AstNodeType.CELL_RANGE,
            start: new CellAddress(3, 5, CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL, 9),
            end: new CellAddress(4, 6, CellReferenceType.CELL_REFERENCE_ABSOLUTE, 9),
            sheetReferenceType: RangeSheetReferenceType.BOTH_ABSOLUTE
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })

        it('row range', () => {
          const ast: RowRangeAst = {
            type: AstNodeType.ROW_RANGE,
            start: new RowAddress(ReferenceType.ABSOLUTE, 2),
            end: new RowAddress(ReferenceType.RELATIVE, 4),
            sheetReferenceType: RangeSheetReferenceType.RELATIVE
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })

        it('column range', () => {
          const ast: ColumnRangeAst = {
            type: AstNodeType.COLUMN_RANGE,
            start: new ColumnAddress(ReferenceType.ABSOLUTE, 2, 8),
            end: new ColumnAddress(ReferenceType.RELATIVE, 4),
            sheetReferenceType: RangeSheetReferenceType.START_ABSOLUTE
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })
      })

      it('percent', () => {
        const ast: PercentOpAst = {
          type: AstNodeType.PERCENT_OP,
          value: buildNumberAst(.42)
        }

        const restored = serializeAndRestoreItem(AstType, ast)
        expect(restored).toEqual(ast)
      })

      describe('function call', () => {
        it('empty function call', () => {
          const ast: ProcedureAst = {
            type: AstNodeType.FUNCTION_CALL,
            procedureName: 'someFunc',
            args: []
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })

        it('function call with one argument', () => {
          const ast: ProcedureAst = {
            type: AstNodeType.FUNCTION_CALL,
            procedureName: 'someFunc',
            args: [
              {
                type: AstNodeType.STRING,
                value: 'hello'
              }
            ],
            leadingWhitespace: '  ',
            internalWhitespace: ' '
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })

        it('function call with several arguments', () => {
          const ast: ProcedureAst = {
            type: AstNodeType.FUNCTION_CALL,
            procedureName: 'anotherFunc',
            args: [
              {
                type: AstNodeType.STRING,
                value: 'hello'
              },
              {
                type: AstNodeType.STRING,
                value: 'world'
              },
              {
                type: AstNodeType.NUMBER,
                value: 42
              },
            ],
            internalWhitespace: ' '
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })
      })

      describe('named expressions', () => {
        it('with no whitespace', () => {
          const ast: NamedExpressionAst = {
            type: AstNodeType.NAMED_EXPRESSION,
            expressionName: 'some expression'
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })

        it('with whitespace', () => {
          const ast: NamedExpressionAst = {
            type: AstNodeType.NAMED_EXPRESSION,
            expressionName: 'another expression',
            leadingWhitespace: ' ',
            internalWhitespace: '  '
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })
      })

      describe('parenthesis', () => {
        it('with no whitespace', () => {
          const ast: ParenthesisAst = {
            type: AstNodeType.PARENTHESIS,
            expression: buildNumberAst(42),
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })

        it('with whitespace', () => {
          const ast: ParenthesisAst = {
            type: AstNodeType.PARENTHESIS,
            expression: buildNumberAst(42),
            leadingWhitespace: ' ',
            internalWhitespace: '  '
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })
      })

      describe('error', () => {
        it('with no whitespace', () => {
          const formulaCellVertex = new FormulaCellVertex(buildNumberAst(42), simpleCellAddress(0, 2, 1), 2)
          const ast: ErrorAst = {
            type: AstNodeType.ERROR,
            error: new CellError(ErrorType.NAME, 'Some Error', formulaCellVertex),
          }

          const restored = serializeAndRestoreItem(AstType, ast, formulaCellVertex)
          expect(restored).toEqual(ast)
        })

        it('with whitespace', () => {
          const formulaCellVertex = new FormulaCellVertex(buildNumberAst(42), simpleCellAddress(0, 2, 1), 2)
          const ast: ErrorAst = {
            type: AstNodeType.ERROR,
            error: new CellError(ErrorType.NAME, 'Some Error', formulaCellVertex),
            leadingWhitespace: ' '
          }

          const restored = serializeAndRestoreItem(AstType, ast, formulaCellVertex)
          expect(restored).toEqual(ast)
        })
      })

      describe('error with raw input', () => {
        it('with no whitespace', () => {
          const formulaCellVertex = new FormulaCellVertex(buildNumberAst(42), simpleCellAddress(0, 2, 1), 2)
          const ast: ErrorWithRawInputAst = {
            type: AstNodeType.ERROR_WITH_RAW_INPUT,
            rawInput: 'Hello',
            error: new CellError(ErrorType.NAME, 'Some Error', formulaCellVertex),
          }

          const restored = serializeAndRestoreItem(AstType, ast, formulaCellVertex)
          expect(restored).toEqual(ast)
        })

        it('with whitespace', () => {
          const formulaCellVertex = new FormulaCellVertex(buildNumberAst(42), simpleCellAddress(0, 2, 1), 2)
          const ast: ErrorWithRawInputAst = {
            type: AstNodeType.ERROR_WITH_RAW_INPUT,
            error: new CellError(ErrorType.NAME, 'Some Error', formulaCellVertex),
            rawInput: 'Test',
            leadingWhitespace: ' '
          }

          const restored = serializeAndRestoreItem(AstType, ast, formulaCellVertex)
          expect(restored).toEqual(ast)
        })
      })

      describe('empty', () => {
        it('with no whitespace', () => {
          const ast: EmptyArgAst = {
            type: AstNodeType.EMPTY,
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })

        it('with whitespace', () => {
          const ast: EmptyArgAst = {
            type: AstNodeType.EMPTY,
            leadingWhitespace: '  '
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })
      })

      describe('array', () => {
        it('with no whitespace', () => {
          const ast: ArrayAst = {
            type: AstNodeType.ARRAY,
            args: [
              [{type: AstNodeType.NUMBER, value: 42}, {type: AstNodeType.NUMBER, value: 43}],
              [{type: AstNodeType.NUMBER, value: 45}, {type: AstNodeType.NUMBER, value: 46}],
            ]
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })

        it('with whitespace', () => {
          const ast: ArrayAst = {
            type: AstNodeType.ARRAY,
            args: [
              [{type: AstNodeType.NUMBER, value: 42}, {type: AstNodeType.NUMBER, value: 43}],
              [{type: AstNodeType.NUMBER, value: 45}, {type: AstNodeType.NUMBER, value: 46}],
            ],
            leadingWhitespace: '  ',
            internalWhitespace: ' ',
          }

          const restored = serializeAndRestoreItem(AstType, ast)
          expect(restored).toEqual(ast)
        })
      })
    })

    describe('vertex types', () => {
      it('formula vertex', () => {
        const vertex = new FormulaCellVertex({
          type: AstNodeType.STRING,
          value: 'Hello'
        } as StringAst, simpleCellAddress(0, 0, 0), 2)

        const restored = serializeAndRestoreItem(VertexType, vertex, vertex)

        expect(restored).toEqual(vertex)
      })

      describe('range vertex', () => {
        it('simple range vertex', () => {
          const range = new AbsoluteCellRange(simpleCellAddress(0, 4, 2), simpleCellAddress(0, 5, 3))
          const vertex = new RangeVertex(range)
          vertex.bruteForce = true

          const restored = serializeAndRestoreItem(VertexType, vertex, vertex)

          expect(restored).toEqual(vertex)
        })
      })

      describe('parsing error vertex', () => {
        it('should serialize and restore correctly', () => {
          const vertex = new ParsingErrorVertex([
            {type: ParsingErrorType.ParserError, message: 'Some message'}
          ], 'Some text')

          const restored = serializeAndRestoreItem(VertexType, vertex, vertex)
          expect(restored).toEqual(vertex)
        })

      })
    })

    it('simple cell address test', () => {
      const addr = {row: 2, col: 5, sheet: 0} as SimpleCellAddress

      const restored = serializeAndRestoreItem(SimpleCellAddressType, addr)
      expect(restored).toEqual(addr)
    })

    function serializeAndRestoreItem<I>(type: AvroTypeCreator, item: I, ...vertices: Vertex[]): I {
      const outEngine = HyperFormula.buildEmpty()
      const outContext = new SerializationContext(outEngine.lazilyTransformingAstService)
      vertices.forEach(v => {
        outContext.vertexResolverService.assignId(v)
      })
      const buffer = type(outContext).AvroType.toBuffer(item)

      const inEngine = HyperFormula.buildEmpty()
      const inConfig = new Config(inEngine.getConfig())
      const inContext = new SerializationContext(inEngine.lazilyTransformingAstService, inConfig.translationPackage)
      vertices.forEach(v => {
        inContext.vertexResolverService.registerVertex(outContext.vertexResolverService.getId(v), v)
        outContext.vertexResolverService.cleanupItem(v)
      })

      const fromBuffer = type(inContext).AvroType.fromBuffer(buffer)
      outContext.vertexResolverService.cleanupItem(item)

      return fromBuffer
    }
  })

  describe('formula cells', () => {
    beforeAll(() => {
      buildEngine({
        useArrayArithmetic: true
      })
      engine.addSheet('Sheet2')

      setCellContents('A1', '=5+6')
      setCellContents('B1', '=A1 + 10')
      setCellContents('Sheet2!C1', 42)
      setCellContents('B2', '=SUM(A1:B1)')
      setCellContents('B3', '=SUMIFS(A1:B1, A1:B1, ">12")')

      setCellContents('D1', 5)
      setCellContents('D2', 10)
      setCellContents('D3', 15)
      setCellContents('E1', 2)
      setCellContents('E2', 2)
      setCellContents('E3', 4)
      setCellContents('F1', '={(ISEVEN(D1:D3*E1:E3))}')
      setCellContents('G1', '=BADFORMULA()')
      setCellContents('G2', '=SUM(E:E)')
      setCellContents('G3', '=SUM(2:2)')
    })

    describe('after serialization', () => {
      beforeAll(() => {
        serializeAndRestore()
      })

      it('should restore a simple formula', () => {
        expect(getRestoredValue('A1')).toEqual(11)
      })

      it('should restore a formula with a relative cell reference', () => {
        expect(getRestoredValue('B1')).toEqual(21)
      })

      it('should restore a range formula', () => {
        expect(getRestoredValue('B2')).toEqual(32)
      })

      it('should restore a range formula with a range condition', () => {
        expect(getRestoredValue('B3')).toEqual(21)
      })

      it('should restore a constant number', () => {
        expect(getRestoredValue('Sheet2!C1')).toEqual(42)
      })

      it('should restore an array formula', () => {
        expect(getRestoredValue('F1')).toEqual(true)
      })

      it('should restore an error formula', () => {
        const cellError = new CellError(
          ErrorType.NAME,
          'Function name BADFORMULA not recognized.',
          engine.addressMapping.getCell(address('G1')) as FormulaVertex
        )

        const expectedCellValue = new DetailedCellError(cellError, '#NAME?', '\'Sheet 1\'!G1')
        expect(getRestoredValue('G1')).toEqual(expectedCellValue)
      })

      it('should restore a range formula with just columns', () => {
        expect(getRestoredValue('G2')).toEqual(8)
      })

      it('should restore a range formula with just rows', () => {
        expect(getRestoredValue('G3')).toEqual(52)
      })
    })

    describe('after deserialization', () => {
      beforeEach(() => {
        buildEngine()
        setCellContents('A1', 23.52)
        setCellContents('B1', 'Some value')
        setCellContents('C1', '=A1 * 10')
        serializeAndRestore()
      })

      it('should allow for setting a new cell', () => {
        setCellContents('A2', '=A1 * 100', restoredEngine)
        expect(getRestoredValue('A2')).toEqual(2352)
      })

      it('should allow for overwriting the value of an existing cell', () => {
        setCellContents('B1', 25, restoredEngine)
        expect(getRestoredValue('B1')).toEqual(25)
      })

      it('should allow for overwriting a precedent of another cell', () => {
        setCellContents('A1', 24, restoredEngine)
        expect(getRestoredValue('C1')).toEqual(240)
      })
    })
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

  function setCellContents(range: string, cellContents: RawCellContent[][] | RawCellContent, engineToUpdate?: HyperFormula) {
    (engineToUpdate || engine).setCellContents(address(range), cellContents)
  }

  function getRestoredValue(range: string, sheetId = 0) {
    return restoredEngine.getCellValue(address(range, sheetId))
  }
})
