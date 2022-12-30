/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import avro, { types } from 'avsc'
import { ParsingError, ParsingErrorType } from '../parser/Ast'
import { ParsingErrorVertex } from '../DependencyGraph'
import { SerializationContext } from './SerializationContext'
import LogicalType = types.LogicalType

interface ParsingErrorFields {
  type: string,
  message: string,
}

const ParsingErrorAvroType = avro.Type.forSchema({
  type: 'record',
  name: 'ParsingError',
  fields: [
    {name: 'type', type: 'string'},
    {name: 'message', type: 'string'},
  ]
})

export interface ParsingErrorVertexFields {
  errors: ParsingErrorFields[],
  rawInput: string,
}

export function ParsingErrorVertexType(_context: SerializationContext) {
  return class ParsingErrorVertexType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: ParsingErrorVertex.TYPE,
      logicalType: 'parsingErrorVertex',
      fields: [
        {name: 'errors', type: avro.Type.forSchema({type: 'array', items: ParsingErrorAvroType})},
        {name: 'rawInput', type: 'string'},
      ]
    }, {
      logicalTypes: {
        'parsingErrorVertex': ParsingErrorVertexType
      }
    })

    protected _fromValue(val: ParsingErrorVertexFields): ParsingErrorVertex {
      const errors = val.errors.map(e => ({
        type: ParsingErrorType[e.type as keyof typeof ParsingErrorType],
        message: e.message,
      }))

      return new ParsingErrorVertex(errors, val.rawInput)
    }

    protected _toValue(parsingErrorVertex: ParsingErrorVertex): ParsingErrorVertexFields {
      return parsingErrorVertex
    }
  }

}
