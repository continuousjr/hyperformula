import avro from 'avsc'
import { SerializationContext } from './SerializationContext'

export interface CellEntry {
  row: number,
  col: number,
  vertexId: number,
}

export function CellEntryType(context: SerializationContext) {
  return class CellEntryType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: 'CellEntry',
      fields: [
        {name: 'row', type: 'int'},
        {name: 'col', type: 'int'},
        {name: 'vertexId', type: 'long'}
      ],
    })
  }
}
