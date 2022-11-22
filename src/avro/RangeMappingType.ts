import avro, { types } from 'avsc'
import { RangeMapping } from '../DependencyGraph'
import { SerializationContext } from './SerializationContext'
import LogicalType = types.LogicalType

interface RangeMappingFields {
  mappings: string,
}

export function RangeMappingType(context: SerializationContext) {
  return class RangeMappingType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: 'RangeMapping',
      logicalType: 'rangeMapping',
      fields: [
        {name: 'mappings', type: 'string'} // This is temporary
      ]
    }, {
      logicalTypes: {
        'rangeMapping': RangeMappingType
      }
    })


    protected _fromValue(fields: RangeMappingFields): RangeMapping {
      return new RangeMapping()
    }

    protected _toValue(mapping: RangeMapping): RangeMappingFields {
      return {
        mappings: 'test'
      }
    }
  }
}

