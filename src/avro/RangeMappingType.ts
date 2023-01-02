/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import avro, { types } from 'avsc'
import {RangeMapping, RangeVertex} from '../DependencyGraph'
import {SerializationContext} from './SerializationContext'
import {VertexRefType} from './VertexRefType'
import LogicalType = types.LogicalType

interface RangeMappingEntry {
  key: string,
  vertex: RangeVertex,
}

interface RangeMappingFields {
  mappings: Record<number, RangeMappingEntry[]>,
}

export function RangeMappingType(context: SerializationContext) {
  const vertexRefType = context.getType(VertexRefType)

  return class RangeMappingType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: 'RangeMapping',
      logicalType: 'rangeMapping',
      fields: [
        {
          name: 'mappings',
          type: avro.Type.forSchema({
            type: 'map',
            values: avro.Type.forSchema({
                type: 'record',
                name: 'RangeMappingEntry',
                fields: [
                  {name: 'key', type: 'string'},
                  {name: 'vertex', type: vertexRefType.AvroType}
                ]
              },
              {
                logicalTypes: {
                  'vertexRef': vertexRefType
                }
              })
          })
        }
      ]
    }, {
      logicalTypes: {
        'rangeMapping': RangeMappingType
      }
    })

    protected _fromValue(fields: RangeMappingFields): RangeMapping {
      const rangeMapping = new RangeMapping()
      for (const sheetId in fields.mappings) {
        const mappingEntries = fields.mappings[sheetId]

        const entryMap = mappingEntries.reduce((acc, entry) => {
          acc.set(entry.key, entry.vertex)
          return acc
        }, new Map<string, RangeVertex>())

        rangeMapping.setSheetMappings(+sheetId, entryMap)
      }

      return rangeMapping
    }

    protected _toValue(mapping: RangeMapping): RangeMappingFields {
      const allMappings: Record<string, RangeMappingEntry[]> = {}

      for (const sheetId in mapping.sheets) {
        const mappings = mapping.getSheetMappings(+sheetId)
        const sheetMappings: RangeMappingEntry[] = []
        allMappings[sheetId] = sheetMappings

        for (const entry of mappings.entries()) {
          const [key, vertex] = entry

          sheetMappings.push({
            key,
            vertex
          })
        }
      }

      return {
        mappings: allMappings
      }
    }
  }
}

