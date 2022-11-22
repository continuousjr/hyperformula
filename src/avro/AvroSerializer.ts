import { HyperFormula } from '../HyperFormula'
import { SerializedEngineState, SerializedEngineType } from './SerializedEngineState'
import { Statistics } from '../statistics'
import { SerializedGraphState } from './SerializedGraphType'
import { CellVertex, Vertex } from '../DependencyGraph'
import { UnresolvedCellVertex } from './AddressMappingType'
import { SerializationContext } from './SerializationContext'
import { LazilyTransformingAstService } from '../LazilyTransformingAstService'

export class AvroSerializer {
  serialize(engine: HyperFormula): Buffer {
    const context: SerializationContext = new SerializationContext(
      engine.lazilyTransformingAstService,
      HyperFormula.getLanguage(engine.getConfig().language)
    )

    const dependencyGraph = engine.dependencyGraph

    const graph = dependencyGraph.graph
    const serializedGraphState: SerializedGraphState<Vertex> = {
      nodes: graph.nodes,
      specialNodes: graph.specialNodes,
      specialNodesRecentlyChanged: graph.specialNodesRecentlyChanged,
      specialNodesStructuralChanges: graph.specialNodesStructuralChanges,
      infiniteRanges: graph.infiniteRanges,
      edges: graph.edges
    }

    const engineState: SerializedEngineState = {
      config: engine.getConfig(),
      graphState: serializedGraphState,
      namedExpressions: dependencyGraph.namedExpressions,
      sheetMapping: dependencyGraph.sheetMapping,
      addressMapping: dependencyGraph.addressMapping,
      rangeMapping: dependencyGraph.rangeMapping,
      arrayMapping: dependencyGraph.arrayMapping
    }

    return SerializedEngineType(context).AvroType.toBuffer(engineState)
  }

  restore(buffer: Buffer, stats: Statistics): HyperFormula {
    const context: SerializationContext = new SerializationContext(new LazilyTransformingAstService(stats))

    const serializedEngineState: SerializedEngineState = SerializedEngineType(context).AvroType.fromBuffer(buffer)

    const addressMapping = serializedEngineState.addressMapping
    for (const [address, vertex] of addressMapping.entries()) {
      const resolvedCell = serializedEngineState.graphState.nodeMap!.get((vertex as UnresolvedCellVertex).id)
      addressMapping.setCell(address, resolvedCell as CellVertex)
    }

    return HyperFormula.buildFromSerializedEngineState(serializedEngineState, stats)
  }
}

