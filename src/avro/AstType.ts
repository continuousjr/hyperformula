/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import avro, {schema, types} from 'avsc'
import {CellAddressType} from './CellAddressType'
import {CellErrorType} from './CellErrorType'
import {Ast, AstNodeType} from '../parser'
import {LogicalAvroType, SerializationContext} from './SerializationContext'
import {ColumnAddressType} from './ColumnAddressType'
import {RowAddressType} from './RowAddressType'
import LogicalType = types.LogicalType
import RecordType = schema.RecordType

interface AstFields {
  value: { [key: string]: Partial<Ast> },
}

const binaryOpSchema = (type: string): RecordType => ({
  type: 'record',
  name: type,
  fields: [
    {name: 'left', type: 'Ast'},
    {name: 'right', type: 'Ast'},
    {name: 'leadingWhitespace', type: 'string', default: ''},
  ]
})

const unaryOpSchema = (type: string): RecordType => ({
  type: 'record',
  name: type,
  fields: [
    {name: 'value', type: 'Ast'},
    {name: 'leadingWhitespace', type: 'string', default: ''},
  ]
})

export function AstType(context: SerializationContext): LogicalAvroType {
  const cellErrorType = context.getLogicalType(CellErrorType)
  const cellAddressType = context.getLogicalType(CellAddressType)
  const columnAddressType = context.getLogicalType(ColumnAddressType)
  const rowAddressType = context.getLogicalType(RowAddressType)

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
                {name: 'value', type: 'string'},
                {name: 'leadingWhitespace', type: 'string', default: ''},
              ],
            },
            {
              type: 'record',
              name: AstNodeType.NUMBER,
              fields: [
                {name: 'value', type: 'double'},
                {name: 'leadingWhitespace', type: 'string', default: ''},
              ]
            },
            binaryOpSchema(AstNodeType.PLUS_OP),
            binaryOpSchema(AstNodeType.MINUS_OP),
            binaryOpSchema(AstNodeType.TIMES_OP),
            binaryOpSchema(AstNodeType.DIV_OP),
            binaryOpSchema(AstNodeType.EQUALS_OP),
            binaryOpSchema(AstNodeType.NOT_EQUAL_OP),
            binaryOpSchema(AstNodeType.GREATER_THAN_OP),
            binaryOpSchema(AstNodeType.GREATER_THAN_OR_EQUAL_OP),
            binaryOpSchema(AstNodeType.LESS_THAN_OP),
            binaryOpSchema(AstNodeType.LESS_THAN_OR_EQUAL_OP),
            binaryOpSchema(AstNodeType.POWER_OP),
            binaryOpSchema(AstNodeType.CONCATENATE_OP),
            {
              type: 'record',
              name: AstNodeType.CELL_REFERENCE,
              fields: [
                {name: 'reference', type: cellAddressType.AvroType},
                {name: 'leadingWhitespace', type: 'string', default: ''},
              ]
            },
            {
              type: 'record',
              name: AstNodeType.CELL_RANGE,
              fields: [
                {name: 'start', type: cellAddressType.AvroType},
                {name: 'end', type: cellAddressType.AvroType},
                {name: 'sheetReferenceType', type: 'int'},
                {name: 'leadingWhitespace', type: 'string', default: ''},
              ]
            },
            {
              type: 'record',
              name: AstNodeType.COLUMN_RANGE,
              fields: [
                {name: 'start', type: columnAddressType.AvroType},
                {name: 'end', type: columnAddressType.AvroType},
                {name: 'sheetReferenceType', type: 'int'},
                {name: 'leadingWhitespace', type: 'string', default: ''},
              ]
            },
            {
              type: 'record',
              name: AstNodeType.ROW_RANGE,
              fields: [
                {name: 'start', type: rowAddressType.AvroType},
                {name: 'end', type: rowAddressType.AvroType},
                {name: 'sheetReferenceType', type: 'int'},
                {name: 'leadingWhitespace', type: 'string', default: ''},
              ]
            },
            unaryOpSchema(AstNodeType.PLUS_UNARY_OP),
            unaryOpSchema(AstNodeType.MINUS_UNARY_OP),
            unaryOpSchema(AstNodeType.PERCENT_OP),
            {
              type: 'record',
              name: AstNodeType.FUNCTION_CALL,
              fields: [
                {name: 'procedureName', type: 'string'},
                {name: 'args', type: {type: 'array', items: 'Ast'}},
                {name: 'leadingWhitespace', type: 'string', default: ''},
                {name: 'internalWhitespace', type: 'string', default: ''},
              ]
            },
            {
              type: 'record',
              name: AstNodeType.NAMED_EXPRESSION,
              fields: [
                {name: 'expressionName', type: 'string'},
                {name: 'leadingWhitespace', type: 'string', default: ''},
                {name: 'internalWhitespace', type: 'string', default: ''},
              ]
            },
            {
              type: 'record',
              name: AstNodeType.PARENTHESIS,
              fields: [
                {name: 'expression', type: 'Ast'},
                {name: 'leadingWhitespace', type: 'string', default: ''},
                {name: 'internalWhitespace', type: 'string', default: ''},
              ]
            },
            {
              type: 'record',
              name: AstNodeType.ERROR,
              fields: [
                {name: 'error', type: cellErrorType.AvroType},
                {name: 'leadingWhitespace', type: 'string', default: ''},
              ]
            },
            {
              type: 'record',
              name: AstNodeType.ERROR_WITH_RAW_INPUT,
              fields: [
                {name: 'rawInput', type: 'string'},
                {name: 'error', type: cellErrorType.AvroType},
                {name: 'leadingWhitespace', type: 'string', default: ''},
              ]
            },
            {
              type: 'record',
              name: AstNodeType.EMPTY,
              fields: [
                {name: 'leadingWhitespace', type: 'string', default: ''},
              ]
            },
            {
              type: 'record',
              name: AstNodeType.ARRAY,
              fields: [
                {name: 'leadingWhitespace', type: 'string', default: ''},
                {name: 'internalWhitespace', type: 'string', default: ''},
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
            },
          ]
        }
      ],
    }, {
      logicalTypes: {
        'ast': AstType,
        'cellError': cellErrorType,
        'cellAddress': cellAddressType,
        'columnAddress': columnAddressType,
        'rowAddress': rowAddressType,
      }
    })


    protected _fromValue(val: any): Ast {
      const unwrapped = val.value.unwrap()
      const type = Object.keys(val.value)[0]
      unwrapped.type = type

      if (unwrapped.leadingWhitespace === '') {
        delete unwrapped.leadingWhitespace
      }

      if (unwrapped.internalWhitespace === '') {
        delete unwrapped.internalWhitespace
      }

      return unwrapped
    }

    protected _toValue(ast: Ast): AstFields {
      const type = ast.type

      return {
        value: {[type]: ast}
      }
    }
  }
}
