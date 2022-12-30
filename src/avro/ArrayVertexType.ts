/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import avro, { types } from 'avsc'
import { SimpleCellAddressType } from './SimpleCellAddressType'
import { SimpleCellAddress } from '../Cell'
import { Ast } from '../parser'
import { SerializationContext } from './SerializationContext'
import { AstType } from './AstType'
import { ArrayVertex } from '../DependencyGraph'
import { CellErrorType } from './CellErrorType'
import { ArraySize } from '../ArraySize'
import { IArray } from '../ArrayValue'
import { ArrayValueType } from './ArrayValueType'
import { ErroredArrayType } from './ErroredArrayType'
import { NotComputedArrayType } from './NotComputedArrayType'
import LogicalType = types.LogicalType


type PreserializedWrappedArray = { [key: string]: IArray }

export interface PostserializedWrappedArray {
  unwrap: () => IArray,
}

export type WrappedArray = PreserializedWrappedArray | PostserializedWrappedArray

interface ArrayVertexFields {
  formula: Ast,
  cellAddress: SimpleCellAddress,
  version: number,
  array: WrappedArray,
}

export function ArrayVertexType(context: SerializationContext) {
  const TEMP_INITIAL_ARRAY_SIZE = new ArraySize(1, 1, false)

  const astType = context.getType(AstType)
  const cellErrorType = context.getType(CellErrorType)
  const arrayValueType = context.getType(ArrayValueType)
  const notComputedArrayType = context.getType(NotComputedArrayType)
  const erroredArrayType = context.getType(ErroredArrayType)
  const simpleCellAddressType = context.getType(SimpleCellAddressType)

  return class ArrayVertexType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: ArrayVertex.TYPE,
      logicalType: 'arrayVertex',
      fields: [
        {name: 'formula', type: astType.AvroType},
        {name: 'cellAddress', type: simpleCellAddressType.AvroType},
        {name: 'version', type: 'int'},
        {
          name: 'array',
          type: avro.Type.forTypes([
            arrayValueType.AvroType,
            notComputedArrayType.AvroType,
            erroredArrayType.AvroType
          ], {
            wrapUnions: true
          })
        }
      ]
    }, {
      logicalTypes: {
        'arrayVertex': ArrayVertexType,
        'simpleCellAddress': simpleCellAddressType,
        'cellError': cellErrorType,
        'arrayValue': arrayValueType,
        'notComputedArray': notComputedArrayType,
        'erroredArray': erroredArrayType,
        'ast': astType
      }
    })

    protected _fromValue(val: ArrayVertexFields): ArrayVertex {
      const arrayVertex = new ArrayVertex(val.formula, val.cellAddress, TEMP_INITIAL_ARRAY_SIZE, val.version)
      arrayVertex.array = (val.array as PostserializedWrappedArray).unwrap()
      return arrayVertex
    }

    protected _toValue(arrayVertex: ArrayVertex): ArrayVertexFields {
      const cellAddress = arrayVertex.getAddress(context.lazilyTransformingAstService)
      const formula = arrayVertex.getFormula(context.lazilyTransformingAstService)

      return {
        formula,
        cellAddress,
        version: arrayVertex.version,
        array: {[arrayVertex.array.type]: arrayVertex.array}
      }
    }
  }
}
