/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import avro, {types} from 'avsc'
import {CellError, ErrorType} from '../Cell'
import {LogicalAvroType, SerializationContext} from './SerializationContext'
import {FormulaVertex} from '../DependencyGraph/FormulaCellVertex'
import {VertexRefType} from './VertexRefType'
import {UnresolvedVertex} from './VertexResolverService'
import {Vertex} from '../DependencyGraph'
import LogicalType = types.LogicalType

export interface CellErrorFields {
  type: string,
  message: string | null,
  root?: FormulaVertex | UnresolvedVertex | null,
}

export function CellErrorType(context: SerializationContext): LogicalAvroType {
  const vertexRefType = context.getLogicalType(VertexRefType)

  return class CellErrorType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: 'CellError',
      logicalType: 'cellError',
      fields: [
        {name: 'type', type: 'string'},
        {name: 'message', type: avro.Type.forTypes([avro.Type.forSchema('null'), avro.Type.forSchema('string')])},
        {name: 'root', type: avro.Type.forTypes([avro.Type.forSchema('null'), vertexRefType.AvroType])},
      ]
    }, {
      logicalTypes: {
        'cellError': CellErrorType,
        'vertexRef': vertexRefType
      }
    })

    protected _fromValue(fields: CellErrorFields): CellError {
      const root = fields.root || undefined
      const error = new CellError(fields.type as ErrorType, fields.message || undefined)

      if ((root as UnresolvedVertex)?.unresolvedVertexId) {
        context.vertexResolverService.registerVertexCallback(root as UnresolvedVertex, (vertex: Vertex) => {
          error.root = vertex as FormulaVertex
        })
      } else if (root) {
        error.root = root as FormulaVertex
      }

      return error
    }

    protected _toValue(val: CellError): CellErrorFields {
      return {
        type: val.type,
        message: val.message || null,
        root: val.root || null
      }
    }
  }
}
