/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import avro, { types } from 'avsc'
import { SerializationContext } from './SerializationContext'
import { ColumnAddress, ReferenceType } from '../parser/ColumnAddress'
import LogicalType = types.LogicalType

interface ColumnAddressFields {
  col: number,
  type: ReferenceType,
  sheet: number | null,
}

export function ColumnAddressType(context: SerializationContext) {
  return class ColumnAddressType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
        type: 'record',
        name: 'ColumnAddress',
        logicalType: 'columnAddress',
        fields: [
          {name: 'col', type: 'int'},
          {name: 'type', type: 'string'},
          {
            name: 'sheet', type: ['int', 'null']
          }
        ]
      },
      {
        logicalTypes: {
          'columnAddress': ColumnAddressType
        }
      }
    )

    _fromValue(val: ColumnAddressFields): ColumnAddress {
      return new ColumnAddress(val.type, val.col, val.sheet || undefined)
    }

    _toValue(ColumnAddress: ColumnAddress): ColumnAddressFields {
      return {
        col: ColumnAddress.col,
        type: ColumnAddress.type,
        sheet: ColumnAddress.sheet || null
      }
    }
  }
}