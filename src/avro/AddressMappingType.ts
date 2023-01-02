/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import avro, { types } from 'avsc'
import {AddressMapping, CellVertex, DenseStrategy, SparseStrategy} from '../DependencyGraph'
import {ChooseAddressMapping} from '../DependencyGraph/AddressMapping/ChooseAddressMappingPolicy'
import {ChooseAddressMappingPolicyType} from './ChooseAddressMappingPolicyType'
import {AddressMappingEntry, AddressMappingEntryType} from './AddressMappingEntryType'
import {CellEntry} from './CellEntryType'
import {SerializationContext} from './SerializationContext'
import LogicalType = types.LogicalType

interface AddressMappingFields {
  policy: ChooseAddressMapping,
  mappingEntries: AddressMappingEntry[],
}

export function AddressMappingType(context: SerializationContext) {
  const chooseAddressMappingPolicyType = context.getType(ChooseAddressMappingPolicyType)
  const addressMappingEntryType = context.getType(AddressMappingEntryType)

  return class AddressMappingType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: 'AddressMapping',
      logicalType: 'addressMapping',
      fields: [
        {name: 'policy', type: chooseAddressMappingPolicyType.AvroType},
        {name: 'mappingEntries', type: avro.Type.forSchema({type: 'array', items: addressMappingEntryType.AvroType})}
      ],
    }, {
      logicalTypes: {
        'addressMapping': AddressMappingType,
        'chooseAddressMapping': chooseAddressMappingPolicyType
      }
    })

    protected _fromValue(fields: AddressMappingFields): AddressMapping {
      const addressMapping = new AddressMapping(fields.policy)

      fields.mappingEntries.forEach((entry) => {
        const strategy = entry.strategy === 'dense' ? new DenseStrategy(entry.cols, entry.rows) : new SparseStrategy(entry.cols, entry.rows)
        entry.cellEntries.forEach(cellEntry => {
          strategy.setCell({col: cellEntry.col, row: cellEntry.row}, cellEntry.vertex as CellVertex)
        })

        addressMapping.addSheet(entry.sheetId, strategy)
      })

      return addressMapping
    }

    protected _toValue(addressMapping: AddressMapping): AddressMappingFields {
      const mappingEntries: AddressMappingEntry[] = []
      for (const sheetId of addressMapping.getSheetIds()) {
        const strategy = addressMapping.strategyFor(sheetId)
        const cellEntries: CellEntry[] = []
        for (const [address, vertex] of strategy.getEntries(sheetId)) {
          cellEntries.push({
            vertex,
            row: address.row,
            col: address.col
          })
        }

        mappingEntries.push({
          sheetId,
          strategy: strategy instanceof DenseStrategy ? 'dense' : 'sparse',
          cols: strategy.getWidth(),
          rows: strategy.getHeight(),
          cellEntries
        })
      }

      return {
        policy: addressMapping.policy,
        mappingEntries
      }
    }
  }
}

