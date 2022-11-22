/* eslint-disable no-extra-boolean-cast */
import avro from 'avsc'
import { CellError } from '../Cell'
import { CellErrorType } from './CellErrorType'
import { SerializationContext } from './SerializationContext'
import { RichNumberType } from './RichNumberType'
import { InterpreterValue, RichNumber } from '../interpreter/InterpreterValue'
import { Maybe } from '../Maybe'
import { ValueCellVertexValue } from '../DependencyGraph/ValueCellVertex'


type CellValue = Maybe<InterpreterValue | ValueCellVertexValue>;

type PreserializedWrappedCellValue = { [key: string]: unknown }

export interface PostserializedWrappedCellValue {
  unwrap: () => CellValue
}

export type WrappedCellValue = PreserializedWrappedCellValue | PostserializedWrappedCellValue

export function wrapCellValue(cellValue: CellValue): PreserializedWrappedCellValue {
  let type: string = typeof (cellValue)
  let value: Maybe<InterpreterValue> | null = cellValue

  if (type === 'undefined') {
    type = 'null'
    value = null
  } else if (type === 'number') {
    type = 'double'
  } else if (type === 'object') {
    if (!!(cellValue as RichNumber).getDetailedType) {
      type = 'RichNumber'
    } else if (!!(cellValue as CellError).attachRootVertex) {
      type = 'CellError'
    }
  }

  return {[type]: value}
}

export function unwrapCellValue(wrappedValue: PostserializedWrappedCellValue) {
  return wrappedValue?.unwrap() || undefined
}

export function CellValueType(context: SerializationContext) {
  const cellErrorType = context.getType(CellErrorType)
  const richNumberType = context.getType(RichNumberType)

  return class CellValueType {
    public static AvroType = avro.Type.forTypes([
      avro.Type.forSchema('null'),
      avro.Type.forSchema('string'),
      avro.Type.forSchema('double'),
      avro.Type.forSchema('boolean'),
      richNumberType.AvroType,
      cellErrorType.AvroType,
      /*simpleRangeValueType.AvroType,*/
    ], {
      wrapUnions: true,
      logicalTypes: {
        'cellError': cellErrorType,
        'richNumber': richNumberType
      }
    })
  }
}
