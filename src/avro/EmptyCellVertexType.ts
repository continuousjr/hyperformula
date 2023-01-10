/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import avro, {types} from 'avsc'
import {SimpleCellAddressType} from './SimpleCellAddressType'
import {SimpleCellAddress} from '../Cell'
import {EmptyCellVertex} from '../DependencyGraph'
import {LogicalAvroType, SerializationContext} from './SerializationContext'
import LogicalType = types.LogicalType

interface EmptyCellVertexFields {
  address: SimpleCellAddress,
}

export function EmptyCellVertexType(context: SerializationContext): LogicalAvroType {
  return class EmptyCellVertexType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: EmptyCellVertex.TYPE,
      logicalType: 'emptyCellVertex',
      fields: [
        {name: 'address', type: SimpleCellAddressType(context).AvroType}
      ]
    }, {
      logicalTypes: {
        'emptyCellVertex': EmptyCellVertexType
      }
    })

    protected _fromValue(val: EmptyCellVertexFields): EmptyCellVertex {
      return new EmptyCellVertex(val.address)
    }

    protected _toValue(emptyCellVertex: EmptyCellVertex): EmptyCellVertexFields {
      return {
        address: emptyCellVertex.address
      }
    }
  }
}
