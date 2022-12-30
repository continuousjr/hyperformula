/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import avro, { types } from 'avsc'
import { SerializationContext } from './SerializationContext'
import { ArraySize } from '../ArraySize'
import LogicalType = types.LogicalType

interface ArraySizeFields {
  width: number,
  height: number,
  isRef: boolean,
}

export function ArraySizeType(context: SerializationContext) {
  return class ArraySizeType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: 'ArraySize',
      logicalType: 'arraySize',
      fields: [
        {name: 'width', type: 'int'},
        {name: 'height', type: 'int'},
        {name: 'isRef', type: 'boolean'},
      ]
    }, {
      logicalTypes: {
        'arraySize': ArraySizeType
      }
    })

    protected _fromValue(fields: ArraySizeFields): ArraySize {
      return new ArraySize(fields.width, fields.height, fields.isRef)
    }

    protected _toValue(size: ArraySize): ArraySizeFields {
      return size
    }
  }
}