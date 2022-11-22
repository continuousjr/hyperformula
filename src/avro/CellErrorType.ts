import avro, { types } from 'avsc'
import { CellError, ErrorType } from '../Cell'
import { VertexWithId } from './VertexWithIdType'
import { SerializationContext } from './SerializationContext'
import LogicalType = types.LogicalType

export interface CellErrorFields {
  type: string,
  message?: string,
  rootId?: number,
}

export type UnresolvedCellError = CellError & {
  rootId: number,
}

export function CellErrorType(context: SerializationContext) {
  return class CellErrorType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: 'CellError',
      logicalType: 'cellError',
      fields: [
        {name: 'type', type: 'string'},
        {name: 'message', type: 'string'},
        {name: 'rootId', type: 'long'},
      ]
    }, {
      logicalTypes: {
        'cellError': CellErrorType
      }
    })

    protected _fromValue(fields: CellErrorFields): CellError {
      const result = new CellError(fields.type as ErrorType, fields.message)
      if (fields.rootId) {
        (result as UnresolvedCellError).rootId = fields.rootId
      }

      return result
    }

    protected _toValue(val: CellError): CellErrorFields {
      return {
        type: val.type,
        message: val.message,
        rootId: val.root ? (val.root as VertexWithId).id : undefined
      }
    }
  }
}
