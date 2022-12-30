/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import { Vertex } from '../DependencyGraph'

type WithId = Vertex & {
  _vid: number,  // Unique vertex id for a serialization run
  _rid: number,  // Unique id for a resolver service instance
}

type VertexCallback = (vertex: Vertex) => void

export interface UnresolvedVertex {
  unresolvedVertexId: number,
}

export class VertexResolverService {
  private id = Date.now()
  private vertexMap = new Map<number, Vertex>()
  private unresolvedCallbacks = new Map<number, VertexCallback[]>()

  private nextId: number = 1

  registerVertex(id: number, vertex: Vertex) {
    this.vertexMap.set(id, vertex)

    const callbacks = this.unresolvedCallbacks.get(id) || []
    callbacks.forEach(callback => callback(vertex))
  }

  getId(vertex: Vertex): number {
    return (vertex as WithId)._vid
  }

  assignId(vertex: Vertex): number {
    const withId = vertex as WithId
    if (withId._rid !== this.id) {
      withId._vid = this.nextId++
      withId._rid = this.id
    }

    return withId._vid
  }

  fromId(id: number): Vertex {
    const vertex = this.vertexMap.get(id)
    if (!vertex) {
      throw new Error(`Failed to resolve vertex with id ${id}`)
    }

    return vertex
  }

  fromIdOrUnresolved(id: number): Vertex | UnresolvedVertex {
    return this.vertexMap.get(id) || {unresolvedVertexId: id}
  }

  registerVertexCallback(unresolved: UnresolvedVertex, callback: VertexCallback) {
    const {unresolvedVertexId} = unresolved

    let callbacks = this.unresolvedCallbacks.get(unresolvedVertexId)
    if (!callbacks) {
      callbacks = []
      this.unresolvedCallbacks.set(unresolvedVertexId, callbacks)
    }

    callbacks.push(callback)
  }

  cleanupItem(item: unknown) {
    const withId = item as WithId
    delete withId._vid
    delete withId._rid
  }
}