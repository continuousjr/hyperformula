/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import avro, {Schema, TypeOptions, types} from 'avsc'
import {Vertex} from '../DependencyGraph'
import {VertexType} from './VertexType'
import {LogicalAvroType, SerializationContext} from './SerializationContext'
import {VertexRefType} from './VertexRefType'
import LogicalType = types.LogicalType

export interface SerializedGraphState<T> {
  nodes: Set<T>,
  specialNodes: Set<T>,
  specialNodesStructuralChanges: Set<T>,
  specialNodesRecentlyChanged: Set<T>,
  infiniteRanges: Set<T>,
  edges: Map<T, Set<T>>,
}

interface SerializedGraphStateFields {
  nodes: Vertex[],
  specialNodes: Vertex[],
  specialNodesStructuralChanges: Vertex[],
  specialNodesRecentlyChanged: Vertex[],
  infiniteRanges: Vertex[],
  edges: Record<number, number[]>,
}


export function SerializedGraphType(context: SerializationContext): LogicalAvroType {
  const vertexType = context.getLogicalType(VertexType)
  const vertexRefType = context.getLogicalType(VertexRefType)

  const {vertexResolverService} = context

  const VertexArray = avro.Type.forSchema({
    type: 'array',
    items: vertexType.AvroType
  }, {
    logicalTypes: {
      'vertex': vertexType
    }
  })

  const VertexRefArray = avro.Type.forSchema({
    type: 'array',
    items: vertexRefType.AvroType
  }, {
    logicalTypes: {
      'vertexRef': vertexRefType
    }
  })

  return class SerializedGraphType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: 'Graph',
      logicalType: 'graph',
      fields: [
        {name: 'nodes', type: VertexArray},
        {name: 'specialNodes', type: VertexRefArray},
        {
          name: 'specialNodesStructuralChanges',
          type: VertexRefArray
        },
        {
          name: 'specialNodesRecentlyChanged',
          type: VertexRefArray
        },
        {name: 'infiniteRanges', type: VertexRefArray},
        {
          name: 'edges', type: avro.Type.forSchema({
            type: 'map', values: avro.Type.forSchema({
              type: 'array',
              items: 'long'
            })
          })
        },
      ],
    }, {
      logicalTypes: {
        'graph': SerializedGraphType,
        'vertex': vertexType,
        'vertexRef': vertexRefType
      }
    })

    constructor(schema: Schema, opts: TypeOptions) {
      super(schema, opts)
    }

    protected _fromValue(graphState: SerializedGraphStateFields): SerializedGraphState<Vertex> {
      const edges = Object.entries(graphState.edges).reduce((map, [sourceId, targetIds]) => {
        const source = vertexResolverService.fromId(+sourceId)
        const mappedTargets = Array.from(targetIds).map(t => {
          return vertexResolverService.fromId(t)
        })
        map.set(source, new Set(mappedTargets));
        return map;
      }, new Map<Vertex, Set<Vertex>>());

      return {
        nodes: new Set(graphState.nodes),
        specialNodes: new Set(graphState.specialNodes),
        specialNodesStructuralChanges: new Set(graphState.specialNodesStructuralChanges),
        specialNodesRecentlyChanged: new Set(graphState.specialNodesRecentlyChanged),
        infiniteRanges: new Set(graphState.infiniteRanges),
        edges: edges,
      }
    }

    protected _toValue(val: SerializedGraphState<Vertex>): SerializedGraphStateFields {
      const nodes = Array.from(val.nodes, (v => {
        vertexResolverService.assignId(v)
        return v
      }))

      const edgeMap: Record<number, number[]> = {}
      val.edges.forEach((targets: Set<Vertex>, source: Vertex) => {
        const vertexId = vertexResolverService.getId(source)
        const vertexTargets = Array.from(targets).map(v => vertexResolverService.getId(v))
        edgeMap[vertexId] = vertexTargets
      })

      return {
        nodes: nodes,
        specialNodes: Array.from(val.specialNodes),
        specialNodesStructuralChanges: Array.from(val.specialNodesStructuralChanges),
        specialNodesRecentlyChanged: Array.from(val.specialNodesRecentlyChanged),
        infiniteRanges: Array.from(val.infiniteRanges),
        edges: edgeMap,
      }
    }
  }
}

