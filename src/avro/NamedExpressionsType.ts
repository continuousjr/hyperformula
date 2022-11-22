import avro, { types } from 'avsc'
import { InternalNamedExpression, NamedExpressions } from '../NamedExpressions'
import { InternalNamedExpressionType } from './InternalNamedExpressionType'
import { SerializationContext } from './SerializationContext'
import LogicalType = types.LogicalType

interface NamedExpressionWithScope {
  expression: InternalNamedExpression,
  scope?: number,
}

interface NamedExpressionsFields {
  expressions: NamedExpressionWithScope[],
}


function NamedExpressionWithScopeType(context: SerializationContext) {
  const internalNamedExpressionType = InternalNamedExpressionType(context)

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

export function NamedExpressionsType(context: SerializationContext) {
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
