/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import {LazilyTransformingAstService} from '../LazilyTransformingAstService'
import {Schema, Type, TypeOptions, types} from 'avsc'
import {TranslationPackage} from '../i18n'
import {VertexResolverService} from './VertexResolverService'
import LogicalType = types.LogicalType

export interface SimpleAvroType {
  new(): unknown,

  AvroType: Type,
}

export interface LogicalAvroType {
  new(schema: Schema, opts: TypeOptions): LogicalType,

  AvroType: Type,
}

export type AvroType = SimpleAvroType | LogicalAvroType
export type AvroTypeCreator = (context: SerializationContext) => AvroType

export class SerializationContext {
  private typeMap = new Map<string, AvroType>()
  public readonly vertexResolverService = new VertexResolverService()

  constructor(
    public lazilyTransformingAstService: LazilyTransformingAstService,
    public language?: TranslationPackage
  ) {
  }

  getType(creatorFn: AvroTypeCreator): AvroType {
    const typeName = creatorFn.name
    if (!this.typeMap.has(typeName)) {
      this.typeMap.set(typeName, creatorFn(this))
    }

    return this.typeMap.get(typeName) as AvroType
  }

  getLogicalType(creatorFn: AvroTypeCreator): LogicalAvroType {
    return this.getType(creatorFn) as LogicalAvroType
  }
}