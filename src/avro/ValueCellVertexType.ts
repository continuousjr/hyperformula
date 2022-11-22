import avro, { types } from 'avsc'
import { ValueCellVertex } from '../DependencyGraph'
import { ValueCellVertexValue } from '../DependencyGraph/ValueCellVertex'
import { SerializationContext } from './SerializationContext'
import {
  CellValueType,
  PostserializedWrappedCellValue,
  unwrapCellValue,
  wrapCellValue,
  WrappedCellValue
} from './CellValueType'
import { RawCellContent } from '../CellContentParser'
import { RichNumberType } from './RichNumberType'
import { CellErrorType } from './CellErrorType'
import LogicalType = types.LogicalType

type ValueCellVertexFields = {
  isDate: boolean,
  parsedValue: WrappedCellValue,
  rawValue: RawCellContent,
}

export function ValueCellVertexType(context: SerializationContext) {
  const cellValueType = context.getType(CellValueType)
  const cellErrorType = context.getType(CellErrorType)
  const richNumberType = context.getType(RichNumberType)

  return class ValueCellVertexType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
        type: 'record',
        name: ValueCellVertex.TYPE,
        logicalType: 'valueCellVertex',
        fields: [
          {name: 'parsedValue', type: cellValueType.AvroType},
          {
            name: 'rawValue', type: avro.Type.forTypes([
              avro.Type.forSchema('string'),
              avro.Type.forSchema('double'),
              avro.Type.forSchema('boolean'),
            ])
          },
          {name: 'isDate', type: 'boolean'}
        ],
      },
      {
        logicalTypes: {
          'valueCellVertex': ValueCellVertexType,
          'richNumber': richNumberType,
          'cellError': cellErrorType,
        }
      })


    protected _fromValue(val: ValueCellVertexFields): ValueCellVertex {
      const rawValue = val.isDate ? new Date(val.rawValue as number) : val.rawValue
      const parsedValue = unwrapCellValue(val.parsedValue as PostserializedWrappedCellValue) as ValueCellVertexValue

      return new ValueCellVertex(parsedValue, rawValue)
    }

    protected _toValue(valueCellVertex: ValueCellVertex): ValueCellVertexFields {
      const {rawValue, parsedValue} = valueCellVertex.getValues()
      const isDate = rawValue instanceof Date

      const raw = isDate ? (rawValue as Date).getTime() : rawValue
      return {
        parsedValue: wrapCellValue(parsedValue),
        rawValue: raw,
        isDate
      }
    }
  }
}
