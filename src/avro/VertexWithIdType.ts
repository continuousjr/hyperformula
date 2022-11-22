import avro, { types } from 'avsc'
import { Vertex } from '../DependencyGraph'
import { ParsingErrorVertexType } from './ParsingErrorVertexType'
import { EmptyCellVertexType } from './EmptyCellVertexType'
import { ValueCellVertexType } from './ValueCellVertexType'
import { FormulaCellVertexType } from './FormulaCellVertexType'
import { SerializationContext } from './SerializationContext'
import { BaseVertex } from '../DependencyGraph/BaseVertex'
import LogicalType = types.LogicalType

export interface ObjectWithId {
  id: number,
}

export type VertexWithId = ObjectWithId & Vertex

export type VertexWithIdFields = ObjectWithId & {
  vertex: {
    [key: string]: Vertex,
  },
}

export function VertexWithIdType(context: SerializationContext) {
  const emptyCellVertexType = EmptyCellVertexType(context)
  const parsingErrorVertexType = ParsingErrorVertexType(context)
  const valueCellVertexType = ValueCellVertexType(context)
  const formulaCellVertexType = FormulaCellVertexType(context)

  /*const VertexType = avro.Type.forTypes([
    emptyCellVertexType.AvroType,
    parsingErrorVertexType.AvroType,
    valueCellVertexType.AvroType,
    formulaCellVertexType.AvroType, /!*
    arrayCellVertexType.AvroType, /!*
    RangeCellVertexType.AvroType,*!/
  ], {
    logicalTypes: {
      'emptyCellVertex': emptyCellVertexType,
      'parsingErrorVertex': parsingErrorVertexType,
      'valueCellVertex': valueCellVertexType,
      'formulaCellVertex': formulaCellVertexType
    }
  })*/

  return class VertexWithIdType extends LogicalType {

    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: 'VertexWithId',
      logicalType: 'vertexWithId',
      fields: [
        {name: 'id', type: 'long'},
        {
          name: 'vertex',
          type: avro.Type.forTypes([
            emptyCellVertexType.AvroType,
            valueCellVertexType.AvroType,
            parsingErrorVertexType.AvroType,
            formulaCellVertexType.AvroType
          ], {
            wrapUnions: true,
          })
        }
      ],
    }, {
      logicalTypes: {
        'vertexWithId': VertexWithIdType,
        'emptyCellVertex': emptyCellVertexType,
        'parsingErrorVertex': parsingErrorVertexType,
        'valueCellVertex': valueCellVertexType,
        'formulaCellVertex': formulaCellVertexType
        /*'rangeVertex': RangeVertexType*/
      },
    })

    protected _fromValue(fields: any): VertexWithId {
      const vertexWithId = fields.vertex.unwrap() as VertexWithId
      vertexWithId.id = fields.id

      return vertexWithId
    }

    protected _toValue(val: VertexWithId): VertexWithIdFields {
      const type = (val as BaseVertex).type

      return {
        id: val.id,
        vertex: {[type]: val}
      }
    }
  }
}

