import { SerializationContext } from './SerializationContext'
import avro, { types } from 'avsc'
import {
  DateNumber,
  DateTimeNumber,
  NumberType,
  PercentNumber,
  RichNumber,
  TimeNumber
} from '../interpreter/InterpreterValue'
import LogicalType = types.LogicalType

interface RichNumberFields {
  type: string,
  val: number,
  format: string | null,
}

type RichNumberTypeConstructor = new (value: number, format?: string) => RichNumber

const RichNumberTypes: { [key: string]: RichNumberTypeConstructor } = {
  [NumberType.NUMBER_DATE]: DateNumber,
  [NumberType.NUMBER_TIME]: TimeNumber,
  [NumberType.NUMBER_DATETIME]: DateTimeNumber,
  [NumberType.NUMBER_PERCENT]: PercentNumber,
}

export function RichNumberType(context: SerializationContext) {
  return class RichNumberType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: 'RichNumber',
      logicalType: 'richNumber',
      fields: [
        {name: 'type', type: 'string'},
        {name: 'val', type: 'double'},
        {name: 'format', type: ['null', 'string']}
      ]
    }, {
      logicalTypes: {
        'richNumber': RichNumberType
      }
    })

    protected _fromValue(fields: RichNumberFields): RichNumber {
      const value = fields.val
      const format = fields.format || undefined
      const NumberType = RichNumberTypes[fields.type]

      if (!NumberType) {
        throw new Error(`Unknown rich number type ${fields.type}`)
      }

      return new NumberType(value, format)
    }

    protected _toValue(value: RichNumber): RichNumberFields {
      return {
        val: value.val,
        type: value.getDetailedType(),
        format: value.format || null
      }
    }
  }
}