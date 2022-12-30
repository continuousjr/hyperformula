/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import { ConfigParams } from '../Config'
import avro, { types } from 'avsc'
import { ConfigParamsType } from './ConfigParamsType'
import { AddressMapping, ArrayMapping, RangeMapping, SheetMapping, Vertex } from '../DependencyGraph'
import { NamedExpressions } from '../NamedExpressions'
import { SerializedGraphState, SerializedGraphType } from './SerializedGraphType'
import { AddressMappingType } from './AddressMappingType'
import { RangeMappingType } from './RangeMappingType'
import { SheetMappingType } from './SheetMappingType'
import { ArrayMappingType } from './ArrayMappingType'
import { NamedExpressionsType } from './NamedExpressionsType'
import { SerializationContext } from './SerializationContext'
import { LazilyTransformingAstService } from '../LazilyTransformingAstService'

import { SlowBuffer } from 'buffer'
import LogicalType = types.LogicalType

// eslint-disable-next-line @typescript-eslint/no-var-requires
const utils = require('../../node_modules/avsc/lib/utils.js')

const Tap = utils.Tap

export interface SerializedEngineState {
  config: ConfigParams,
  graphState: SerializedGraphState<Vertex>,
  addressMapping: AddressMapping,
  rangeMapping: RangeMapping,
  sheetMapping: SheetMapping,
  arrayMapping: ArrayMapping,
  namedExpressions: NamedExpressions,
  lazilyTransformingAstService?: LazilyTransformingAstService,
}

export function SerializedEngineType(context: SerializationContext) {
  const configParamsType = context.getType(ConfigParamsType)
  const serializedGraphType = context.getType(SerializedGraphType)
  const addressMappingType = context.getType(AddressMappingType)
  const rangeMappingType = context.getType(RangeMappingType)
  const sheetMappingType = context.getType(SheetMappingType)
  const arrayMappingType = context.getType(ArrayMappingType)
  const namedExpressionsType = context.getType(NamedExpressionsType)

  const TAP = new Tap(new SlowBuffer(1024 * 1024 * 500))

  return class SerializedEngineType extends LogicalType {

    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: 'SerializedEngine',
      logicalType: 'serializedEngine',
      fields: [
        {name: 'config', type: configParamsType.AvroType},
        {name: 'graphState', type: serializedGraphType.AvroType},
        {name: 'addressMapping', type: addressMappingType.AvroType},
        {name: 'rangeMapping', type: rangeMappingType.AvroType},
        {name: 'sheetMapping', type: sheetMappingType.AvroType},
        {name: 'arrayMapping', type: arrayMappingType.AvroType},
        {name: 'namedExpressions', type: namedExpressionsType.AvroType},
      ],
    }, {
      logicalTypes: {
        'serializedEngine': SerializedEngineType,
        'graph': serializedGraphType,
        'configParams': configParamsType,
        'addressMapping': addressMappingType,
        'rangeMapping': rangeMappingType,
        'sheetMapping': sheetMappingType,
        'arrayMapping': arrayMappingType,
        'namedExpressions': namedExpressionsType
      }
    })

    toBuffer(val: any): Buffer {
      TAP.pos = 0;

      (this as any)._write(TAP, val)

      const buf = utils.newBuffer(TAP.pos)
      if (TAP.isValid()) {
        TAP.buf.copy(buf, 0, 0, TAP.pos)
      } else {
        (this as any)._write(new Tap(buf), val)
      }

      return buf
    }


    protected _fromValue(val: SerializedEngineState): SerializedEngineState {
      val.lazilyTransformingAstService = context.lazilyTransformingAstService
      return val
    }


    protected _toValue(engineState: SerializedEngineState): SerializedEngineState {
      return engineState
    }
  }
}

