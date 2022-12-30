/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import avro, { types } from 'avsc'
import { SimpleCellAddress } from '../Cell'
import { InternalNamedExpression, NamedExpressionOptions } from '../NamedExpressions'
import { SimpleCellAddressType } from './SimpleCellAddressType'
import { SerializationContext } from './SerializationContext'
import LogicalType = types.LogicalType

interface InternalNamedExpressionFields {
  displayName: string,
  address: SimpleCellAddress,
  added: boolean,
  options?: NamedExpressionOptions,
}

export function InternalNamedExpressionType(context: SerializationContext) {
  return class InternalNamedExpressionType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: 'InternalNamedExpression',
      logicalType: 'internalNamedExpression',
      fields: [
        {name: 'displayName', type: 'string'},
        {name: 'address', type: SimpleCellAddressType(context).AvroType},
        {name: 'added', type: 'boolean'},
        {
          name: 'options', type: avro.Type.forSchema({
            type: 'map',
            values: avro.Type.forTypes([
              avro.Type.forSchema({type: 'string'}),
              avro.Type.forSchema({type: 'long'}),
              avro.Type.forSchema({type: 'boolean'})
            ])
          })
        },
      ]
    }, {
      logicalTypes: {
        'internalNamedExpression': InternalNamedExpressionType
      }
    })

    protected _fromValue(fields: InternalNamedExpressionFields): InternalNamedExpression {
      return new InternalNamedExpression(fields.displayName, fields.address, fields.added, fields.options)
    }

    protected _toValue(expression: InternalNamedExpression): InternalNamedExpressionFields {
      return {
        displayName: expression.displayName,
        added: expression.added,
        address: expression.address,
        options: expression.options
      }
    }
  }
}