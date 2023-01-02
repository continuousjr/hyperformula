/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import avro, { types } from 'avsc'
import {SerializationContext} from './SerializationContext'
import {RowAddress} from '../parser/RowAddress'
import {ReferenceType} from '../parser/ColumnAddress'
import LogicalType = types.LogicalType

interface RowAddressFields {
  row: number,
  type: ReferenceType,
  sheet: number | null,
}

export function RowAddressType(context: SerializationContext) {
  return class RowAddressType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
        type: 'record',
        name: 'RowAddress',
        logicalType: 'rowAddress',
        fields: [
          {name: 'row', type: 'int'},
          {name: 'type', type: 'string'},
          {
            name: 'sheet', type: ['int', 'null']
          }
        ]
      },
      {
        logicalTypes: {
          'rowAddress': RowAddressType
        }
      }
    )

    _fromValue(val: RowAddressFields): RowAddress {
      return new RowAddress(val.type, val.row, val.sheet || undefined)
    }

    _toValue(RowAddress: RowAddress): RowAddressFields {
      return {
        row: RowAddress.row,
        type: RowAddress.type,
        sheet: RowAddress.sheet || null
      }
    }
  }
}