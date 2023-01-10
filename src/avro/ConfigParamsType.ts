/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import avro, {types} from 'avsc'
import {LogicalAvroType, SerializationContext} from './SerializationContext'
import {ConfigParams} from '../Config'
import {HyperFormula} from '../HyperFormula'
import {ChooseAddressMappingPolicyType} from './ChooseAddressMappingPolicyType'
import LogicalType = types.LogicalType

export function ConfigParamsType(context: SerializationContext): LogicalAvroType {
  const chooseAddressMappingPolicyType = context.getLogicalType(ChooseAddressMappingPolicyType)

  return class ConfigParamsType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: 'ConfigParams',
      logicalType: 'configParams',
      fields: [
        {name: 'accentSensitive', type: 'boolean'},
        {name: 'binarySearchThreshold', type: 'int'},
        {name: 'caseSensitive', type: 'boolean'},
        {name: 'caseFirst', type: 'string'},
        {name: 'chooseAddressMappingPolicy', type: chooseAddressMappingPolicyType.AvroType},
        {name: 'currencySymbol', type: avro.Type.forSchema({type: 'array', items: 'string'})},
        {name: 'dateFormats', type: avro.Type.forSchema({type: 'array', items: 'string'})},
        {name: 'functionArgSeparator', type: 'string'},
        {name: 'decimalSeparator', type: 'string'},
        {name: 'evaluateNullToZero', type: 'boolean'},
        {name: 'ignorePunctuation', type: 'boolean'},
        {name: 'language', type: 'string'},
        {name: 'licenseKey', type: 'string'},
        {name: 'ignoreWhiteSpace', type: 'string'},
        {name: 'leapYear1900', type: 'boolean'},
        {name: 'localeLang', type: 'string'},
        {name: 'matchWholeCell', type: 'boolean'},
        {name: 'arrayColumnSeparator', type: 'string'},
        {name: 'arrayRowSeparator', type: 'string'},
        {name: 'maxRows', type: 'int'},
        {name: 'maxColumns', type: 'int'},
        {
          name: 'nullDate', type: avro.Type.forSchema({
            type: 'record',
            name: 'SimpleDate',
            fields: [
              {name: 'year', type: 'int'},
              {name: 'month', type: 'int'},
              {name: 'day', type: 'int'},
            ]
          })
        },
        {name: 'nullYear', type: 'int'},
        {name: 'precisionEpsilon', type: 'double'},
        {name: 'precisionRounding', type: 'int'},
        {name: 'smartRounding', type: 'boolean'},
        {name: 'thousandSeparator', type: 'string'},
        {name: 'timeFormats', type: avro.Type.forSchema({type: 'array', items: 'string'})},
        {name: 'useArrayArithmetic', type: 'boolean'},
        {name: 'useColumnIndex', type: 'boolean'},
        {name: 'useStats', type: 'boolean'},
        {name: 'undoLimit', type: 'int'},
        {name: 'useRegularExpressions', type: 'boolean'},
        {name: 'useWildcards', type: 'boolean'},
      ]
    }, {
      logicalTypes: {
        'configParams': ConfigParamsType,
        'chooseAddressMappingPolicy': chooseAddressMappingPolicyType,
      }
    })


    protected _fromValue(val: ConfigParams): ConfigParams {
      context.language = HyperFormula.getLanguage(val.language)

      return val
    }


    protected _toValue(configParams: ConfigParams): ConfigParams {
      return configParams
    }
  }
}

