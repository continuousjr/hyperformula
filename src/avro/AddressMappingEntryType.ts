/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import avro from 'avsc'
import { CellEntry, CellEntryType } from './CellEntryType'
import { SerializationContext } from './SerializationContext'

export interface AddressMappingEntry {
  sheetId: number,
  strategy: string,
  rows: number,
  cols: number,
  cellEntries: CellEntry[],
}

export function AddressMappingEntryType(context: SerializationContext) {
  const cellEntryType = context.getType(CellEntryType)

  return class AddressMappingEntryType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: 'AddressMappingEntry',
      fields: [
        {name: 'sheetId', type: 'int'},
        {name: 'strategy', type: 'string'},
        {name: 'rows', type: 'int'},
        {name: 'cols', type: 'int'},
        {name: 'cellEntries', type: avro.Type.forSchema({type: 'array', items: cellEntryType.AvroType})}
      ],
    })
  }
}

