import avro from 'avsc'
import { SerializationContext } from './SerializationContext'

export function SimpleCellAddressType(context: SerializationContext) {
  return class SimpleCellAddressType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: 'SimpleCellAddress',
      fields: [
        {name: 'col', type: 'int'},
        {name: 'row', type: 'int'},
        {name: 'sheet', type: 'int'}
      ]
    })
  }
}
