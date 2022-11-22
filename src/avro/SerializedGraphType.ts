import avro, { Schema, TypeOptions, types } from 'avsc'
import { Graph, ValueCellVertex, Vertex } from '../DependencyGraph'
import { VertexWithId, VertexWithIdType } from './VertexWithIdType'
import { CellError } from '../Cell'
import { FormulaVertex } from '../DependencyGraph/FormulaCellVertex'
import { SerializationContext } from './SerializationContext'
import { UnresolvedCellError } from './CellErrorType'
import LogicalType = types.LogicalType

export interface SerializedGraphState<T> {
  nodeMap?: Map<number, T>,
  nodes: Set<T>,
  specialNodes: Set<T>,
  specialNodesStructuralChanges: Set<T>,
  specialNodesRecentlyChanged: Set<T>,
  infiniteRanges: Set<T>,
  edges: Map<T, Set<T>>,
}

interface SerializedGraphStateFields<T> {
  nodes: T[],
  nodeMap?: Map<number, T>,
  specialNodes: number[],
  specialNodesStructuralChanges: number[],
  specialNodesRecentlyChanged: number[],
  infiniteRanges: number[],
  edges: Map<number, number[]>,
}


export function SerializedGraphType(context: SerializationContext) {
  const vertexWithIdType = context.getType(VertexWithIdType)

  const VertexWithIdArray = avro.Type.forSchema({
    type: 'array',
    items: vertexWithIdType.AvroType
  }, {
    logicalTypes: {
      'vertexWithId': vertexWithIdType
    }
  })

  return class SerializedGraphType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: 'Graph',
      logicalType: 'graph',
      fields: [
        {name: 'nodes', type: VertexWithIdArray},
        {name: 'specialNodes', type: VertexWithIdArray},
        {
          name: 'specialNodesStructuralChanges',
          type: VertexWithIdArray
        },
        {
          name: 'specialNodesRecentlyChanged',
          type: VertexWithIdArray
        },
        {name: 'infiniteRanges', type: VertexWithIdArray},
        {name: 'edges', type: avro.Type.forSchema({type: 'map', values: vertexWithIdType.AvroType})},
      ],
    }, {
      logicalTypes: {
        'graph': SerializedGraphType,
        'vertexWithId': vertexWithIdType
      }
    })

    constructor(schema: Schema, opts: TypeOptions) {
      super(schema, opts)
    }

    protected _fromValue(graphState: SerializedGraphStateFields<VertexWithId>): SerializedGraphState<Vertex> {
      const errorCells: ValueCellVertex[] = []

      const nodeMap = graphState.nodes.reduce((acc, node) => {
        acc.set(node.id, node)

        if (node instanceof ValueCellVertex && node.getCellValue() instanceof CellError) {
          errorCells.push(node)
        }

        return acc
      }, new Map<number, Vertex>())

      errorCells.forEach(cell => {
        const unresolved = cell.getCellValue() as UnresolvedCellError
        if (unresolved.rootId) {
          const rootVertex = nodeMap.get(unresolved.rootId)
          if (rootVertex) {
            unresolved.attachRootVertex(rootVertex as FormulaVertex)
          }
          delete unresolved.rootId
        }
      })

      return {
        nodeMap,
        nodes: new Set(graphState.nodes),
        specialNodes: new Set(graphState.specialNodes.map(id => nodeMap.get(id) as Vertex)),
        specialNodesStructuralChanges: new Set(graphState.specialNodesStructuralChanges.map(id => nodeMap.get(id) as Vertex)),
        specialNodesRecentlyChanged: new Set(graphState.specialNodesRecentlyChanged.map(id => nodeMap.get(id) as Vertex)),
        infiniteRanges: new Set(graphState.infiniteRanges.map(id => nodeMap.get(id) as Vertex)),
        edges: new Map(
          Array.from(graphState.edges,
            (
              [source, targets]) =>
              ([nodeMap.get(source) as Vertex, new Set(Array.from(targets).map(id => nodeMap.get(id) as Vertex))])
          )
        ),
      }
    }

    protected _toValue(val: SerializedGraphState<Vertex>): SerializedGraphStateFields<VertexWithId> {
      const nodes = Array.from(val.nodes as Set<VertexWithId>,
        (n: VertexWithId, idx) => {
          n.id = idx

          return n
        })

      return {
        nodes,
        specialNodes: Array.from(val.specialNodes).map(v => (v as VertexWithId).id),
        specialNodesStructuralChanges: Array.from(val.specialNodesStructuralChanges).map(v => (v as VertexWithId).id),
        specialNodesRecentlyChanged: Array.from(val.specialNodesRecentlyChanged).map(v => (v as VertexWithId).id),
        infiniteRanges: Array.from(val.infiniteRanges).map(v => (v as VertexWithId).id),
        edges: new Map(
          Array.from(val.edges,
            (
              [source, targets]) =>
              ([(source as VertexWithId).id, Array.from(targets).map(v => (v as VertexWithId).id)])
          )
        ),
      }
    }
  }
}

