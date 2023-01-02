/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import {CellError} from '../Cell'
import {ParsingError} from '../parser/Ast'
import {BaseVertex} from './BaseVertex'

export class ParsingErrorVertex extends BaseVertex {
  public static TYPE = 'PARSING_ERROR_VERTEX'

  constructor(
    public readonly errors: ParsingError[],
    public readonly rawInput: string
  ) {
    super(ParsingErrorVertex.TYPE)
  }

  public getCellValue(): CellError {
    return CellError.parsingError()
  }

  public getFormula(): string {
    return this.rawInput
  }
}
