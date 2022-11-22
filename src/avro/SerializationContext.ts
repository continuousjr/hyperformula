import { LazilyTransformingAstService } from '../LazilyTransformingAstService'
import { Schema, Type, TypeOptions } from 'avsc'
import { TranslationPackage } from '../i18n'

export interface SimpleAvroType<T> {
  new(): T,

  AvroType: Type,
}

export interface LogicalAvroType<T> {
  new(schema: Schema, opts: TypeOptions): T,

  AvroType: Type,
}

export type AvroType<T> = SimpleAvroType<T> | LogicalAvroType<T>
export type AvroTypeCreator<T> = (context: SerializationContext) => AvroType<T>

export class SerializationContext {
  private typeMap = new Map<string, AvroType<unknown>>()

  constructor(
    public lazilyTransformingAstService: LazilyTransformingAstService,
    public language?: TranslationPackage
  ) {
  }

  getType<T>(creatorFn: AvroTypeCreator<T>): AvroType<T> {
    const typeName = creatorFn.name
    if (!this.typeMap.has(typeName)) {
      this.typeMap.set(typeName, creatorFn(this))
    }

    return this.typeMap.get(typeName) as AvroType<T>
  }
}