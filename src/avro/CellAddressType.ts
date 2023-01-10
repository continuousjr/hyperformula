/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import avro, {types} from 'avsc'
import {CellAddress} from '../parser'
import {CellReferenceType} from '../parser/CellAddress'
import {LogicalAvroType, SerializationContext} from './SerializationContext'
import LogicalType = types.LogicalType

interface CellAddressFields {
  col: number,
  row: number,
  type: CellReferenceType,
  sheet: number | null,
}

export function CellAddressType(context: SerializationContext): LogicalAvroType {
  return class CellAddressType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
        type: 'record',
        name: 'CellAddress',
        logicalType: 'cellAddress',
        fields: [
          {name: 'col', type: 'int'},
          {name: 'row', type: 'int'},
          {name: 'type', type: 'string'},
          {
            name: 'sheet', type: ['int', 'null']
          }
        ]
      },
      {
        logicalTypes: {
          'cellAddress': CellAddressType
        }
      }
    )

    _fromValue(val: CellAddressFields): CellAddress {
      return new CellAddress(val.col, val.row, val.type, val.sheet || undefined)
    }

    _toValue(cellAddress: CellAddress): CellAddressFields {
      return {
        col: cellAddress.col,
        row: cellAddress.row,
        type: cellAddress.type,
        sheet: cellAddress.sheet || null
      }
    }
  }
}