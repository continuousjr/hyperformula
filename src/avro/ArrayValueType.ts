/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import avro, { types } from 'avsc'
import { SerializationContext } from './SerializationContext'
import { ArrayType, ArrayValue } from '../ArrayValue'
import {
  InterpreterValueType,
  PostserializedWrappedInterpreterValue,
  unwrapInterpreterValue,
  wrapInterpreterValue,
  WrappedInterpreterValue
} from './InterpreterValueType'
import { EmptyValue, InternalScalarValue, InterpreterValue } from '../interpreter/InterpreterValue'
import LogicalType = types.LogicalType

interface ArrayValueFields {
  array: (WrappedInterpreterValue | InterpreterValue | null)[][],
}

export function ArrayValueType(context: SerializationContext) {
  const interpreterValueType = context.getType(InterpreterValueType)

  return class ArrayValueType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: ArrayType.VALUE,
      logicalType: 'arrayValue',
      fields: [
        {
          name: 'array',
          type: avro.Type.forSchema({
            type: 'array',
            items: avro.Type.forSchema({
              type: 'array',
              items: avro.Type.forTypes([
                avro.Type.forSchema('null'),
                interpreterValueType.AvroType
              ])
            })
          })
        }
      ]
    }, {
      logicalTypes: {
        'arrayValue': ArrayValueType
      }
    })

    protected _fromValue(fields: ArrayValueFields): ArrayValue {
      const values = fields.array
      for (let i = 0; i < values.length; i++) {
        for (let j = 0; j < values[i].length; j++) {
          const unwrapped = unwrapInterpreterValue(values[i][j] as PostserializedWrappedInterpreterValue)
          values[i][j] = unwrapped === null ? EmptyValue : unwrapped as InterpreterValue
        }
      }

      return new ArrayValue(values as InternalScalarValue[][])
    }

    protected _toValue(arrayValue: ArrayValue): ArrayValueFields {
      const origValues = arrayValue.raw()
      const array = new Array(origValues.length)

      for (let i = 0; i < origValues.length; i++) {
        array[i] = new Array(origValues[i].length)
        for (let j = 0; j < origValues[i].length; j++) {
          const value = origValues[i][j]
          array[i][j] = wrapInterpreterValue(value === EmptyValue ? null : value)
        }
      }

      return {
        array: array
      }
    }
  }
}