/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import avro, {types} from 'avsc'
import {
  AlwaysDense,
  AlwaysSparse,
  ChooseAddressMapping,
  DenseSparseChooseBasedOnThreshold
} from '../DependencyGraph/AddressMapping/ChooseAddressMappingPolicy'
import {LogicalAvroType, SerializationContext} from './SerializationContext'
import LogicalType = types.LogicalType

interface ChooseAddressMappingPolicyFields {
  type: string,
  threshold: number | null,
}

export function ChooseAddressMappingPolicyType(context: SerializationContext): LogicalAvroType {
  return class ChooseAddressMappingPolicyType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: 'ChooseAddressMappingPolicy',
      logicalType: 'chooseAddressMappingPolicy',
      fields: [
        {name: 'type', type: 'string'},
        {name: 'threshold', type: ['int', 'null']},
      ]
    }, {
      logicalTypes: {
        'chooseAddressMappingPolicy': ChooseAddressMappingPolicyType
      }
    })

    protected _fromValue(fields: ChooseAddressMappingPolicyFields): ChooseAddressMapping {
      const {threshold, type} = fields

      let mappingPolicy
      if (type === 'choose') {
        mappingPolicy = new DenseSparseChooseBasedOnThreshold(threshold!)
      } else if (type === 'alwaysDense') {
        mappingPolicy = new AlwaysDense()
      } else {
        mappingPolicy = new AlwaysSparse()
      }

      return mappingPolicy
    }

    protected _toValue(policy: ChooseAddressMapping): ChooseAddressMappingPolicyFields {
      let type
      let threshold = null

      if (policy instanceof DenseSparseChooseBasedOnThreshold) {
        type = 'choose'
        threshold = policy.threshold
      } else if (policy instanceof AlwaysDense) {
        type = 'alwaysDense'
      } else {
        type = 'alwaysSparse'
      }

      return {
        type,
        threshold
      }
    }
  }
}

