import avro, { types } from 'avsc'
import { CellAddressType } from './CellAddressType'
import { CellErrorType } from './CellErrorType'
import { Ast, AstNodeType } from '../parser'
import { SerializationContext } from './SerializationContext'
import LogicalType = types.LogicalType

const RangeSheetReferenceEnumType = avro.Type.forSchema({
    type: 'enum',
    name: 'RangeSheetReferenceType',
    symbols: ['RELATIVE', 'START_ABSOLUTE', 'BOTH_ABSOLUTE']
  }
)

interface AstFields {
  value: { [key: string]: Ast },
}

export function AstType(context: SerializationContext) {
  const cellErrorType = CellErrorType(context)
  const cellAddressType = CellAddressType(context)

  return class AstType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: 'Ast',
      logicalType: 'ast',
      fields: [
        {
          name: 'value',
          type: [
            {
              type: 'record',
              name: AstNodeType.STRING,
              fields: [
                {name: 'type', type: 'string'},
                {name: 'value', type: 'string'},
                {name: 'leadingWhitespace', type: 'string', default: ''},
              ],
            },
            {
              type: 'record',
              name: AstNodeType.NUMBER,
              fields: [
                {name: 'type', type: 'string'},
                {name: 'value', type: 'double'},
                {name: 'leadingWhitespace', type: 'string', default: ''},
              ]
            },
            {
              type: 'record',
              name: 'BINARY_OP',
              fields: [
                {name: 'type', type: 'string'},
                {name: 'left', type: 'Ast'},
                {name: 'right', type: 'Ast'},
                {name: 'leadingWhitespace', type: 'string', default: ''},
              ]
            },
            {
              type: 'record',
              name: AstNodeType.CELL_REFERENCE,
              fields: [
                {name: 'type', type: 'string'},
                {name: 'reference', type: cellAddressType.AvroType},
                {name: 'leadingWhitespace', type: 'string', default: ''},
              ]
            },
            /*{
              type: 'record',
              name: 'CellRangeAst',
              fields: [
                {name: 'type', type: 'string'},
                {name: 'start', type: cellAddressType.AvroType},
                {name: 'end', type: cellAddressType.AvroType},
                {name: 'leadingWhitespace', type: 'string'},
              ]
            },
            {
              type: 'record',
              name: 'ColumnRangeAst',
              fields: [
                {name: 'type', type: 'string'},
                {name: 'start', type: cellAddressType.AvroType},
                {name: 'end', type: cellAddressType.AvroType},
                {name: 'sheetReferenceType', type: RangeSheetReferenceEnumType},
                {name: 'leadingWhitespace', type: 'string'},
              ]
            },
            {
              type: 'record',
              name: 'RowRangeAst',
              fields: [
                {name: 'type', type: 'string'},
                {name: 'start', type: cellAddressType.AvroType},
                {name: 'end', type: cellAddressType.AvroType},
                {name: 'sheetReferenceType', type: RangeSheetReferenceEnumType},
                {name: 'leadingWhitespace', type: 'string'},
              ]
            },
            {
              type: 'record',
              name: 'PercentOpAst',
              fields: [
                {name: 'type', type: 'string'},
                {name: 'value', type: 'Ast'},
                {name: 'leadingWhitespace', type: 'string'},
              ]
            },
            {
              type: 'record',
              name: 'BinaryOpAst',
              fields: [
                {name: 'type', type: 'string'},
                {name: 'left', type: 'Ast'},
                {name: 'right', type: 'Ast'},
                {name: 'leadingWhitespace', type: 'string'},
              ]
            },
            {
              type: 'record',
              name: 'ProcedureAst',
              fields: [
                {name: 'type', type: 'string'},
                {name: 'procedureName', type: 'string'},
                {name: 'args', type: {type: 'array', items: 'Ast'}},
                {name: 'leadingWhitespace', type: 'string'},
                {name: 'internalWhitespace', type: 'string'},
              ]
            },
            {
              type: 'record',
              name: 'NamedExpressionAst',
              fields: [
                {name: 'type', type: 'string'},
                {name: 'expressionName', type: 'string'},
                {name: 'leadingWhitespace', type: 'string'},
                {name: 'internalWhitespace', type: 'string'},
              ]
            },
            {
              type: 'record',
              name: 'ParenthesisAst',
              fields: [
                {name: 'type', type: 'string'},
                {name: 'expression', type: 'Ast'},
                {name: 'leadingWhitespace', type: 'string'},
                {name: 'internalWhitespace', type: 'string'},
              ]
            },
            {
              type: 'record',
              name: 'ErrorAst',
              fields: [
                {name: 'type', type: 'string'},
                {name: 'error', type: cellErrorType.AvroType},
                {name: 'leadingWhitespace', type: 'string'},
              ]
            },
            {
              type: 'record',
              name: 'ErrorWithRawInputAst',
              fields: [
                {name: 'type', type: 'string'},
                {name: 'rawInput', type: 'string'},
                {name: 'error', type: cellErrorType.AvroType},
                {name: 'leadingWhitespace', type: 'string'},

              ]
            },
            {
              type: 'record',
              name: 'EmptyArgAst',
              fields: [
                {name: 'type', type: 'string'},
                {name: 'leadingWhitespace', type: 'string'},
              ]
            },
            {
              type: 'record',
              name: 'ArrayAst',
              fields: [
                {name: 'type', type: 'string'},
                {name: 'leadingWhitespace', type: 'string'},
                {name: 'internalWhitespace', type: 'string'},
                {
                  name: 'args',
                  type: {
                    type: 'array',
                    items: {
                      type: 'array',
                      items: 'Ast'
                    }
                  }
                }
              ]
            },*/

          ]
        }
      ],
    }, {
      logicalTypes: {
        'ast': AstType,
        'cellError': cellErrorType,
        'cellAddress': cellAddressType
      }
    })


    protected _fromValue(val: any): Ast {
      const unwrapped = val.value.unwrap()
      if (unwrapped.leadingWhitespace === '') {
        delete unwrapped.leadingWhitespace
      }

      if (unwrapped.leadingWhitespace === '') {
        delete unwrapped.leadingWhitespace
      }

      return unwrapped
    }

    protected _toValue(ast: Ast): AstFields {
      let type: string = ast.type
      switch (ast.type) {
        case AstNodeType.PLUS_OP:
        case AstNodeType.MINUS_OP:
        case AstNodeType.TIMES_OP:
        case AstNodeType.DIV_OP:
          type = 'BINARY_OP'
          break
        default:
          type = ast.type
          break
      }
      return {
        value: {[type]: ast}
      }
    }
  }
}
