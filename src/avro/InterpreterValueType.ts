/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

/* eslint-disable no-extra-boolean-cast */
import avro from 'avsc'
import {CellError} from '../Cell'
import {CellErrorType} from './CellErrorType'
import {SerializationContext} from './SerializationContext'
import {RichNumberType} from './RichNumberType'
import {InterpreterValue, RichNumber} from '../interpreter/InterpreterValue'
import {Maybe} from '../Maybe'
import {ValueCellVertexValue} from '../DependencyGraph/ValueCellVertex'
import {SimpleRangeValueType} from './SimpleRangeValueType'
import {SimpleRangeValue} from '../SimpleRangeValue'


type MaybeInterpreterValue = Maybe<InterpreterValue | ValueCellVertexValue> | null

type PreserializedWrappedInterpreterValue = { [key: string]: MaybeInterpreterValue }

export interface PostserializedWrappedInterpreterValue {
  unwrap: () => MaybeInterpreterValue,
}

export type WrappedInterpreterValue = PreserializedWrappedInterpreterValue | PostserializedWrappedInterpreterValue

export function wrapInterpreterValue(cellValue: MaybeInterpreterValue): PreserializedWrappedInterpreterValue {
  let type: string = typeof (cellValue)
  let value: Maybe<InterpreterValue> | null = cellValue

  if (type === 'undefined' || type === 'null') {
    type = 'null'
    value = null
  } else if (type === 'number') {
    type = 'double'
  } else if (type === 'boolean') {
    type = 'boolean'
  } else if (type === 'object') {
    if (!!(cellValue as RichNumber).getDetailedType) {
      type = 'RichNumber'
    } else if (!!(cellValue as CellError).attachRootVertex) {
      type = 'CellError'
    } else if (!!(cellValue as SimpleRangeValue).isAdHoc) {
      type = 'SimpleRangeValue'
    }
  }

  return {[type]: value}
}

export function unwrapInterpreterValue(wrappedValue: PostserializedWrappedInterpreterValue) {
  let unwrapped = wrappedValue?.unwrap()
  if (unwrapped === null) {
    unwrapped = undefined
  }

  return unwrapped
}

export function InterpreterValueType(context: SerializationContext) {
  const cellErrorType = context.getType(CellErrorType)
  const richNumberType = context.getType(RichNumberType)
  const simpleRangeValueType = context.getType(SimpleRangeValueType)

  return class InterpreterValueType {
    public static AvroType = avro.Type.forTypes([
      avro.Type.forSchema('null'),
      avro.Type.forSchema('string'),
      avro.Type.forSchema('double'),
      avro.Type.forSchema('boolean'),
      richNumberType.AvroType,
      cellErrorType.AvroType,
      simpleRangeValueType.AvroType,
    ], {
      wrapUnions: true,
      logicalTypes: {
        'cellError': cellErrorType,
        'richNumber': richNumberType,
        'simpleRangeValue': simpleRangeValueType
      }
    })
  }
}

export function InternalScalarValueType(context: SerializationContext) {
  const cellErrorType = context.getType(CellErrorType)
  const richNumberType = context.getType(RichNumberType)

  return class InterpreterValueType {
    public static AvroType = avro.Type.forTypes([
      avro.Type.forSchema('null'),
      avro.Type.forSchema('string'),
      avro.Type.forSchema('double'),
      avro.Type.forSchema('boolean'),
      richNumberType.AvroType,
      cellErrorType.AvroType
    ], {
      wrapUnions: true,
      logicalTypes: {
        'cellError': cellErrorType,
        'richNumber': richNumberType
      }
    })
  }
}

