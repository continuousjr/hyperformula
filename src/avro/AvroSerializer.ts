/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import {HyperFormula} from '../HyperFormula'
import {SerializedEngineState, SerializedEngineType} from './SerializedEngineState'
import {Statistics, StatType} from '../statistics'
import {SerializedGraphState} from './SerializedGraphType'
import {SerializationContext} from './SerializationContext'
import {LazilyTransformingAstService} from '../LazilyTransformingAstService'
import {Vertex} from '../DependencyGraph'

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

    stats.start(StatType.DESERIALIZE_ENGINE_STATE)
    const serializedEngineState: SerializedEngineState = SerializedEngineType(context).AvroType.fromBuffer(buffer)
    stats.end(StatType.DESERIALIZE_ENGINE_STATE)

    return HyperFormula.buildFromSerializedEngineState(serializedEngineState, stats)
  }
}

