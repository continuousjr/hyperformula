/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import avro, { types } from 'avsc'
import { SerializationContext } from './SerializationContext'
import { SimpleCellAddress } from '..'
import LogicalType = types.LogicalType

interface SimpleCellAddressFields {
  col: number | null,
  row: number | null,
  sheet: number,
}

export function SimpleCellAddressType(_context: SerializationContext) {
  return class SimpleCellAddressType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: 'SimpleCellAddress',
      logicalType: 'simpleCellAddress',
      fields: [
        {
          name: 'col', type: avro.Type.forTypes([
            avro.Type.forSchema('null'),
            avro.Type.forSchema('int')
          ])
        },
        {
          name: 'row', type: avro.Type.forTypes([
            avro.Type.forSchema('null'),
            avro.Type.forSchema('int')
          ])
        },
        {name: 'sheet', type: 'int'}
      ]
    }, {
      logicalTypes: {
        'simpleCellAddress': SimpleCellAddressType
      }
    })

    protected _fromValue(val: SimpleCellAddressFields): SimpleCellAddress {
      return {
        col: val.col === null ? Infinity : val.col,
        row: val.row === null ? Infinity : val.row,
        sheet: val.sheet
      }
    }

    protected _toValue(val: SimpleCellAddress): SimpleCellAddressFields {
      return {
        col: val.col === Infinity ? null : val.col,
        row: val.row === Infinity ? null : val.row,
        sheet: val.sheet
      }
    }
  }
}
