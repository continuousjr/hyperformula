/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import avro, {types} from 'avsc'
import {LogicalAvroType, SerializationContext} from './SerializationContext'
import {ArraySize} from '../ArraySize'
import {ArraySizeType} from './ArraySizeType'
import {ArrayType, NotComputedArray} from '../ArrayValue'
import LogicalType = types.LogicalType

interface NotComputedArrayFields {
  size: ArraySize,
}

export function NotComputedArrayType(context: SerializationContext): LogicalAvroType {
  const arraySizeType = context.getLogicalType(ArraySizeType)

  return class NotComputedArrayType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: ArrayType.NOT_COMPUTED,
      logicalType: 'notComputedArray',
      fields: [
        {name: 'size', type: arraySizeType.AvroType}
      ]
    }, {
      logicalTypes: {
        'notComputedArray': NotComputedArrayType,
        'arraySize': arraySizeType
      }
    })

    protected _fromValue(fields: NotComputedArrayFields): NotComputedArray {
      return new NotComputedArray(fields.size)
    }

    protected _toValue(notComputedArray: NotComputedArray): NotComputedArrayFields {
      return {
        size: notComputedArray.size
      }
    }
  }
}