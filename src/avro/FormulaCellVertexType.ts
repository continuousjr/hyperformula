/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import avro, { types } from 'avsc'
import {SimpleCellAddressType} from './SimpleCellAddressType'
import {SimpleCellAddress} from '../Cell'
import {Ast} from '../parser'
import {SerializationContext} from './SerializationContext'
import {AstType} from './AstType'
import {FormulaCellVertex} from '../DependencyGraph'
import {RichNumberType} from './RichNumberType'
import {CellErrorType} from './CellErrorType'
import {
  InterpreterValueType,
  PostserializedWrappedInterpreterValue,
  unwrapInterpreterValue,
  wrapInterpreterValue,
  WrappedInterpreterValue
} from './InterpreterValueType'
import LogicalType = types.LogicalType

interface FormulaCellVertexFields {
  formula: Ast,
  cellAddress: SimpleCellAddress,
  version: number,
  cachedCellValue: WrappedInterpreterValue,
}

export function FormulaCellVertexType(context: SerializationContext) {
  const astType = context.getType(AstType)
  const cellErrorType = context.getType(CellErrorType)
  const richNumberType = context.getType(RichNumberType)
  const interpreterValueType = context.getType(InterpreterValueType)
  const simpleCellAddressType = context.getType(SimpleCellAddressType)

  return class FormulaCellVertexType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: FormulaCellVertex.TYPE,
      logicalType: 'formulaCellVertex',
      fields: [
        {name: 'formula', type: astType.AvroType},
        {name: 'cellAddress', type: simpleCellAddressType.AvroType},
        {name: 'version', type: 'int'},
        {name: 'cachedCellValue', type: interpreterValueType.AvroType}
      ]
    }, {
      logicalTypes: {
        'formulaCellVertex': FormulaCellVertexType,
        'simpleCellAddress': simpleCellAddressType,
        'cellError': cellErrorType,
        'richNumber': richNumberType,
        'ast': astType
      }
    })

    protected _fromValue(val: FormulaCellVertexFields): FormulaCellVertex {
      const formulaCellVertex = new FormulaCellVertex(val.formula, val.cellAddress, val.version)
      const cachedValue = unwrapInterpreterValue(val.cachedCellValue as PostserializedWrappedInterpreterValue)
      if (typeof cachedValue !== 'undefined') {
        formulaCellVertex.setCellValue(cachedValue)
      }

      return formulaCellVertex
    }

    protected _toValue(formulaCellVertex: FormulaCellVertex): FormulaCellVertexFields {
      let result = {} as FormulaCellVertexFields

      const cellAddress = formulaCellVertex.getAddress(context.lazilyTransformingAstService)
      const formula = formulaCellVertex.getFormula(context.lazilyTransformingAstService)

      result = {
        formula,
        cellAddress,
        version: formulaCellVertex.version,
        cachedCellValue: wrapInterpreterValue(formulaCellVertex.valueOrUndef())
      }

      return result
    }
  }
}
