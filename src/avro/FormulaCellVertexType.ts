import avro, { types } from 'avsc'
import { SimpleCellAddressType } from './SimpleCellAddressType'
import { SimpleCellAddress } from '../Cell'
import { Ast } from '../parser'
import { SerializationContext } from './SerializationContext'
import { AstType } from './AstType'
import { FormulaCellVertex } from '../DependencyGraph'
import { RichNumberType } from './RichNumberType'
import { CellErrorType } from './CellErrorType'
import {
  CellValueType,
  PostserializedWrappedCellValue,
  unwrapCellValue,
  wrapCellValue,
  WrappedCellValue
} from './CellValueType'
import LogicalType = types.LogicalType

interface FormulaCellVertexFields {
  formula: Ast,
  cellAddress: SimpleCellAddress,
  version: number,
  cachedCellValue: WrappedCellValue,
}

export function FormulaCellVertexType(context: SerializationContext) {
  const astType = context.getType(AstType)
  const cellErrorType = context.getType(CellErrorType)
  const richNumberType = context.getType(RichNumberType)
  const cellValueType = context.getType(CellValueType)

  return class FormulaCellVertexType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: FormulaCellVertex.TYPE,
      logicalType: 'formulaCellVertex',
      fields: [
        {name: 'formula', type: astType.AvroType},
        {name: 'cellAddress', type: context.getType(SimpleCellAddressType).AvroType},
        {name: 'version', type: 'int'},
        {name: 'cachedCellValue', type: cellValueType.AvroType}
      ]
    }, {
      logicalTypes: {
        'formulaCellVertex': FormulaCellVertexType,
        'cellError': cellErrorType,
        'richNumber': richNumberType,
        'ast': astType
      }
    })

    protected _fromValue(val: FormulaCellVertexFields): FormulaCellVertex {
      const formulaCellVertex = new FormulaCellVertex(val.formula, val.cellAddress, val.version)
      const cachedValue = unwrapCellValue(val.cachedCellValue as PostserializedWrappedCellValue)
      if (cachedValue) {
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
        cachedCellValue: wrapCellValue(formulaCellVertex.valueOrUndef())
      }

      return result
    }
  }
}
