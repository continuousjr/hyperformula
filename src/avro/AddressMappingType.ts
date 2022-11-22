import avro, { types } from 'avsc'
import { AddressMapping, DenseStrategy, EmptyCellVertex, SparseStrategy } from '../DependencyGraph'
import { ChooseAddressMapping } from '../DependencyGraph/AddressMapping/ChooseAddressMappingPolicy'
import { ChooseAddressMappingPolicyType } from './ChooseAddressMappingPolicyType'
import { AddressMappingEntry, AddressMappingEntryType } from './AddressMappingEntryType'
import { CellEntry } from './CellEntryType'
import { VertexWithId } from './VertexWithIdType'
import { SerializationContext } from './SerializationContext'
import LogicalType = types.LogicalType

interface AddressMappingFields {
  policy: ChooseAddressMapping,
  mappingEntries: AddressMappingEntry[],
}

export class UnresolvedCellVertex extends EmptyCellVertex {
  private static NoAddress = {row: -1, col: -1, sheet: -1}

  constructor(public id: number) {
    super(UnresolvedCellVertex.NoAddress)
  }
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
          strategy.setCell({col: cellEntry.col, row: cellEntry.row}, new UnresolvedCellVertex(cellEntry.vertexId))
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
            vertexId: (vertex as VertexWithId).id,
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

