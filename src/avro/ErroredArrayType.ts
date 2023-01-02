/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import avro, { types } from 'avsc'
import {CellError} from '../Cell'
import {SerializationContext} from './SerializationContext'
import {ArraySize} from '../ArraySize'
import {CellErrorType} from './CellErrorType'
import {ArraySizeType} from './ArraySizeType'
import {ArrayType, ErroredArray} from '../ArrayValue'
import LogicalType = types.LogicalType

interface ErroredArrayFields {
  error: CellError,
  size: ArraySize,
}

export function ErroredArrayType(context: SerializationContext) {
  const cellErrorType = context.getType(CellErrorType)
  const arraySizeType = context.getType(ArraySizeType)

  return class ErroredArrayType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: ArrayType.ERROR,
      logicalType: 'erroredArray',
      fields: [
        {name: 'error', type: cellErrorType.AvroType},
        {name: 'size', type: arraySizeType.AvroType}
      ]
    }, {
      logicalTypes: {
        'erroredArray': ErroredArrayType,
        'cellError': cellErrorType,
        'arraySize': arraySizeType
      }
    })

    protected _fromValue(fields: ErroredArrayFields): ErroredArray {
      return new ErroredArray(fields.error, fields.size)
    }

    protected _toValue(erroredArray: ErroredArray): ErroredArrayFields {
      return {
        error: erroredArray.simpleRangeValue(),
        size: erroredArray.size
      }
    }
  }
}