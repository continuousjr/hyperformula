import avro, { types } from 'avsc'
import { SerializationContext } from './SerializationContext'
import { ConfigParams } from '../Config'
import { HyperFormula } from '../HyperFormula'
import LogicalType = types.LogicalType

export function ConfigParamsType(context: SerializationContext) {
  return class ConfigParamsType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: 'ConfigParams',
      logicalType: 'configParams',
      fields: [
        {name: 'caseFirst', type: 'string'},
        {name: 'language', type: 'string'},
      ]
    }, {
      logicalTypes: {
        'configParams': ConfigParamsType
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

