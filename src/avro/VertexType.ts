/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import avro, {types} from 'avsc'
import {Vertex} from '../DependencyGraph'
import {ParsingErrorVertexType} from './ParsingErrorVertexType'
import {EmptyCellVertexType} from './EmptyCellVertexType'
import {ValueCellVertexType} from './ValueCellVertexType'
import {FormulaCellVertexType} from './FormulaCellVertexType'
import {LogicalAvroType, SerializationContext} from './SerializationContext'
import {BaseVertex} from '../DependencyGraph/BaseVertex'
import {RangeVertexType} from './RangeVertexType'
import {ArrayVertexType} from './ArrayVertexType'
import LogicalType = types.LogicalType

type WrappedVertex = { [key: string]: Vertex } & {
  unwrap?: () => Vertex,
}

export interface VertexFields {
  id: number,
  vertex: WrappedVertex,
}

export function VertexType(context: SerializationContext): LogicalAvroType {
  const emptyCellVertexType = context.getLogicalType(EmptyCellVertexType)
  const parsingErrorVertexType = context.getLogicalType(ParsingErrorVertexType)
  const valueCellVertexType = context.getLogicalType(ValueCellVertexType)
  const formulaCellVertexType = context.getLogicalType(FormulaCellVertexType)
  const rangeVertexType = context.getLogicalType(RangeVertexType)
  const arrayVertexType = context.getLogicalType(ArrayVertexType)

  const {vertexResolverService} = context

  return class VertexType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: 'Vertex',
      logicalType: 'vertex',
      fields: [
        {name: 'id', type: 'long'},
        {
          name: 'vertex',
          type: avro.Type.forTypes([
            emptyCellVertexType.AvroType,
            valueCellVertexType.AvroType,
            parsingErrorVertexType.AvroType,
            formulaCellVertexType.AvroType,
            rangeVertexType.AvroType,
            arrayVertexType.AvroType
          ], {
            wrapUnions: true,
          })
        }
      ],
    }, {
      logicalTypes: {
        'vertex': VertexType,
        'emptyCellVertex': emptyCellVertexType,
        'parsingErrorVertex': parsingErrorVertexType,
        'valueCellVertex': valueCellVertexType,
        'formulaCellVertex': formulaCellVertexType,
        'rangeVertex': rangeVertexType,
        'arrayVertex': arrayVertexType,
      },
    })

    protected _fromValue(fields: any): Vertex {
      const {id, vertex} = fields

      const result = vertex.unwrap()
      vertexResolverService.registerVertex(id, result)

      return result
    }

    protected _toValue(val: Vertex): VertexFields {
      const type = (val as BaseVertex).type
      const id = vertexResolverService.assignId(val)

      return {
        id,
        vertex: {[type]: val}
      }
    }
  }
}

