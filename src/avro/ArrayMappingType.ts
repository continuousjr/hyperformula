import avro, { types } from 'avsc'
import { ArrayMapping } from '../DependencyGraph'
import { SerializationContext } from './SerializationContext'
import LogicalType = types.LogicalType

interface ArrayMappingFields {
  mappings: string,
}

export function ArrayMappingType(context: SerializationContext) {
  return class ArrayMappingType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: 'ArrayMapping',
      logicalType: 'arrayMapping',
      fields: [
        {name: 'mappings', type: 'string'} // This is temporary
      ]
    }, {
      logicalTypes: {
        'arrayMapping': ArrayMappingType
      }
    })


    protected _fromValue(fields: ArrayMappingFields): ArrayMapping {
      return new ArrayMapping()
    }

    protected _toValue(mapping: ArrayMapping): ArrayMappingFields {
      return {
        mappings: ''
      }
    }
  }
}

