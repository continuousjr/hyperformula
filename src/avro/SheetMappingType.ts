/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import avro, {types} from 'avsc'
import {SheetMapping} from '../DependencyGraph'
import {Sheet} from '../DependencyGraph/SheetMapping'
import {SheetType} from './SheetType'
import {LogicalAvroType, SerializationContext} from './SerializationContext'
import LogicalType = types.LogicalType

interface SheetMappingFields {
  sheets: Sheet[],
}

export function SheetMappingType(context: SerializationContext): LogicalAvroType {
  const sheetType = context.getLogicalType(SheetType)

  return class SheetMappingType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: 'SheetMapping',
      logicalType: 'sheetMapping',
      fields: [
        {name: 'sheets', type: avro.Type.forSchema({type: 'array', items: sheetType.AvroType})}
      ]
    }, {
      logicalTypes: {
        'sheetMapping': SheetMappingType,
        'sheet': sheetType
      }
    })

    protected _fromValue(fields: SheetMappingFields): SheetMapping {
      const sheetMapping = new SheetMapping(context.language!)
      sheetMapping.setSheets(fields.sheets)
      return sheetMapping
    }

    protected _toValue(mapping: SheetMapping): SheetMappingFields {
      return {
        sheets: mapping.sheets()
      }
    }
  }
}
