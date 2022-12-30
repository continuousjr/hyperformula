/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import avro, { types } from 'avsc'
import { SimpleCellAddressType } from './SimpleCellAddressType'
import { SimpleCellAddress } from '../Cell'
import { SerializationContext } from './SerializationContext'
import { RangeVertex } from '../DependencyGraph'
import { AbsoluteCellRange } from '../AbsoluteCellRange'
import LogicalType = types.LogicalType

interface RangeVertexFields {
  bruteForce: boolean,
  start: SimpleCellAddress,
  end: SimpleCellAddress,
}

export function RangeVertexType(context: SerializationContext) {
  const simpleCellAddressType = context.getType(SimpleCellAddressType)

  return class RangeVertexType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: 'RANGE_VERTEX',
      logicalType: 'rangeVertex',
      fields: [
        {name: 'bruteForce', type: 'boolean'},
        {name: 'start', type: simpleCellAddressType.AvroType},
        {name: 'end', type: simpleCellAddressType.AvroType},
      ]
    }, {
      logicalTypes: {
        'rangeVertex': RangeVertexType,
        'simpleCellAddress': simpleCellAddressType
      }
    })

    // TODO: Save/Restore range vertex caches and dependentCacheRange
    protected _fromValue(val: RangeVertexFields): RangeVertex {
      const rangeVertex = new RangeVertex(new AbsoluteCellRange(val.start, val.end))
      rangeVertex.bruteForce = val.bruteForce
      return rangeVertex
    }

    protected _toValue(rangeVertex: RangeVertex): RangeVertexFields {
      return {
        bruteForce: rangeVertex.bruteForce,
        start: rangeVertex.start,
        end: rangeVertex.end,
      }
    }
  }
}
