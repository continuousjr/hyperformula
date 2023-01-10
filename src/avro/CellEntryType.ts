/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import avro from 'avsc'
import {SerializationContext, SimpleAvroType} from './SerializationContext'
import {Vertex} from '../DependencyGraph'
import {VertexRefType} from './VertexRefType'

export interface CellEntry {
  row: number,
  col: number,
  vertex: Vertex,
}

export function CellEntryType(context: SerializationContext): SimpleAvroType {
  const vertexRefType = context.getLogicalType(VertexRefType)

  return class CellEntryType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: 'CellEntry',
      fields: [
        {name: 'row', type: 'int'},
        {name: 'col', type: 'int'},
        {name: 'vertex', type: vertexRefType.AvroType}
      ],
    }, {
      logicalTypes: {
        'vertexRef': vertexRefType
      }
    })
  }
}
