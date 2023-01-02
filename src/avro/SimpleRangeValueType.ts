/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import avro, { types } from 'avsc'
import {SerializationContext} from './SerializationContext'
import {
  InternalScalarValueType,
  PostserializedWrappedInterpreterValue,
  unwrapInterpreterValue,
  wrapInterpreterValue,
  WrappedInterpreterValue
} from './InterpreterValueType'
import {EmptyValue, InternalScalarValue} from '../interpreter/InterpreterValue'
import {SimpleRangeValue} from '../SimpleRangeValue'
import LogicalType = types.LogicalType

export interface SimpleRangeValueFields {
  data: (WrappedInterpreterValue | InternalScalarValue)[][],
}

export function SimpleRangeValueType(context: SerializationContext) {
  const internalScalarValueType = context.getType(InternalScalarValueType)

  return class SimpleRangeValueType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: 'SimpleRangeValue',
      logicalType: 'simpleRangeValue',
      fields: [
        {
          name: 'data',
          type: avro.Type.forSchema({
            type: 'array',
            items: avro.Type.forSchema({
              type: 'array',
              items: avro.Type.forTypes([
                avro.Type.forSchema('null'),
                internalScalarValueType.AvroType
              ])
            })
          })
        }
      ]
    }, {
      logicalTypes: {
        'simpleRangeValue': SimpleRangeValueType
      }
    })

    protected _fromValue(fields: SimpleRangeValueFields): SimpleRangeValue {
      const values = fields.data
      for (let i = 0; i < values.length; i++) {
        for (let j = 0; j < values[i].length; j++) {
          const unwrapped = unwrapInterpreterValue(values[i][j] as PostserializedWrappedInterpreterValue)
          values[i][j] = unwrapped === null ? EmptyValue : unwrapped as InternalScalarValue
        }
      }

      return new SimpleRangeValue(values as InternalScalarValue[][])
    }

    protected _toValue(val: SimpleRangeValue): SimpleRangeValueFields {
      const origValues = val.data
      const array = new Array(origValues.length)

      for (let i = 0; i < origValues.length; i++) {
        array[i] = new Array(origValues[i].length)
        for (let j = 0; j < origValues[i].length; j++) {
          const value = origValues[i][j]
          array[i][j] = wrapInterpreterValue(value === EmptyValue ? null : value)
        }
      }

      return {
        data: array
      }
    }
  }
}
