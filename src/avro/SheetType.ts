import avro, { types } from 'avsc'
import { Sheet } from '../DependencyGraph/SheetMapping'
import { SerializationContext } from './SerializationContext'
import LogicalType = types.LogicalType

interface SheetFields {
  id: number,
  displayName: string,
}

export function SheetType(context: SerializationContext) {
  return class SheetType extends LogicalType {
    public static AvroType = avro.Type.forSchema({
      type: 'record',
      name: 'Sheet',
      logicalType: 'sheet',
      fields: [
        {name: 'id', type: 'int'},
        {name: 'displayName', type: 'string'}
      ]
    })

    protected _fromValue(fields: SheetFields): Sheet {
      return new Sheet(fields.id, fields.displayName)
    }

    protected _toValue(sheet: Sheet): SheetFields {
      return {
        id: sheet.id,
        displayName: sheet.displayName
      }
    }
  }
}
