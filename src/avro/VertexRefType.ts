/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import avro, {types} from 'avsc'
import {Vertex} from '../DependencyGraph'
import {LogicalAvroType, SerializationContext} from './SerializationContext'
import {UnresolvedVertex} from './VertexResolverService'
import LogicalType = types.LogicalType


export function VertexRefType(context: SerializationContext): LogicalAvroType {
  const {vertexResolverService} = context

  return class VertexRefType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'long',
      name: 'VertexRef',
      logicalType: 'vertexRef',
    }, {
      logicalTypes: {
        'vertexRef': VertexRefType
      }
    })

    protected _fromValue(val: number): Vertex | UnresolvedVertex {
      return vertexResolverService.fromIdOrUnresolved(val)
    }

    protected _toValue(val: Vertex): number {
      const id = vertexResolverService.getId(val)
      if (!id) {
        throw new Error('Attempting to serialize reference to vertex with no id')
      }

      return id
    }
  }
}

