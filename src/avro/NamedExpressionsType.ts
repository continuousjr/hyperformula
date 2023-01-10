/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import avro, {types} from 'avsc'
import {InternalNamedExpression, NamedExpressions} from '../NamedExpressions'
import {InternalNamedExpressionType} from './InternalNamedExpressionType'
import {LogicalAvroType, SerializationContext, SimpleAvroType} from './SerializationContext'
import LogicalType = types.LogicalType

interface NamedExpressionWithScope {
  expression: InternalNamedExpression,
  scope?: number,
}

interface NamedExpressionsFields {
  expressions: NamedExpressionWithScope[],
}


function NamedExpressionWithScopeType(context: SerializationContext): SimpleAvroType {
  const internalNamedExpressionType = context.getLogicalType(InternalNamedExpressionType)

  return class NamedExpressionWithScopeType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: 'ExpressionTypeWithScope',
      fields: [
        {name: 'expression', type: internalNamedExpressionType.AvroType},
        {name: 'scope', type: 'int'}
      ]
    }, {
      logicalTypes: {
        'internalNamedExpression': internalNamedExpressionType
      }
    })
  }
}

export function NamedExpressionsType(context: SerializationContext): LogicalAvroType {
  return class NamedExpressionsType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: 'NamedExpressions',
      logicalType: 'namedExpressions',
      fields: [
        {
          name: 'expressions', type: avro.Type.forSchema({
            type: 'array',
            items: NamedExpressionWithScopeType(context).AvroType
          })
        }
      ]
    }, {
      logicalTypes: {
        'namedExpressions': NamedExpressionsType
      }
    })

    protected _fromValue(fields: NamedExpressionsFields): NamedExpressions {
      const namedExpressions = new NamedExpressions()

      fields.expressions.forEach(expressionWithScope => {
        namedExpressions.restoreNamedExpression(expressionWithScope.expression, expressionWithScope.scope)
      })

      return namedExpressions
    }

    protected _toValue(namedExpressions: NamedExpressions): NamedExpressionsFields {
      return {
        expressions: namedExpressions.getAllNamedExpressions()
      }
    }
  }
}
