/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import { SimpleCellAddress } from '../Cell'
import { EmptyValue, EmptyValueType } from '../interpreter/InterpreterValue'
import { BaseVertex } from './BaseVertex'

/**
 * Represents singleton vertex bound to all empty cells
 */
export class EmptyCellVertex extends BaseVertex {
  public static TYPE = 'EMPTY_CELL_VERTEX'

  constructor(
    public address: SimpleCellAddress //might be outdated!
  ) {
    super(EmptyCellVertex.TYPE)
  }

  /**
   * Retrieves cell value bound to that singleton
   */
  public getCellValue(): EmptyValueType {
    return EmptyValue
  }
}
