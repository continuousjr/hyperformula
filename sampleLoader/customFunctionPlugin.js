import {CellError, ErrorType, FunctionArgumentType, FunctionPlugin} from '../dist/hyperformula.full.js';

/**
 *
 */
export class CustomFunctionPlugin extends FunctionPlugin {
  /**
   *
   */
  value(ast, state) {
    return this.runFunction(ast.args, state, this.metadata('VALUE'), (val) => {
      return val
    })
  }

  /**
   *
   */
  vdb(ast, state) {
    return this.runFunction(ast.args, state, this.metadata('VDB'), (cost, salvage, life, startPeriod, endPeriod, factor, noSwitch) => {
      let observedDepreciation = 0

      try {
        this.assertNonNegative(cost, 'Cost')
        this.assertNonNegative(salvage, 'Salvage')
        this.assertPositive(life, 'Life')
        this.assertNonNegative(startPeriod, 'Start Period')
        this.assertNonNegative(endPeriod, 'End Period')
        this.assertNonNegative(factor, 'Factor')

        if (endPeriod < startPeriod || life < startPeriod) {
          return 0
        }

        const periods = Math.ceil(endPeriod)
        const rate = factor / life

        let totalDepreciation = 0
        for (let i = 0; i < periods; i++) {
          const remainingLife = life - i
          const bookValue = cost - totalDepreciation

          const depreciation = this.depreciationForPeriod(bookValue, salvage, remainingLife, rate, cost, noSwitch)
          observedDepreciation += this.observedDepreciationForPeriod(i, startPeriod, endPeriod, depreciation)

          totalDepreciation += depreciation
        }
      } catch (e) {
        return e
      }

      return observedDepreciation
    },)
  }

  /**
   *
   */
  observedDepreciationForPeriod(lifeAtStart, startPeriod, endPeriod, depreciation) {
    const lifeAtEnd = lifeAtStart + 1

    let observedFraction = 0
    if (lifeAtStart < endPeriod && lifeAtEnd > startPeriod) {
      observedFraction = Math.min(lifeAtEnd, endPeriod) - Math.max(lifeAtStart, startPeriod)
    }

    return depreciation * observedFraction
  }

  /**
   *
   */
  depreciationForPeriod(bookValue, salvage, remainingLife, rate, cost, noSwitch) {
    const straightLine = (bookValue - salvage) / remainingLife
    const declining = Math.min(bookValue * rate, cost - salvage)

    return noSwitch ? declining : Math.max(straightLine, declining)
  }

  /**
   *
   */
  assertPositive(value, fieldName) {
    if (value <= 0) {
      throw new CellError(ErrorType.NUM, `Argument ${fieldName} of function VDB must be a positive number.`)
    }
  }

  /**
   *
   */
  assertNonNegative(value, fieldName) {
    if (value < 0) {
      throw new CellError(ErrorType.NUM, `Argument ${fieldName} of function VDB must be greater than or equal to 0.`)
    }
  }
}

CustomFunctionPlugin.implementedFunctions = {
  VALUE: {
    method: 'value', parameters: [{argumentType: FunctionArgumentType.NUMBER}],
  }, VDB: {
    method: 'vdb',
    parameters: [{argumentType: FunctionArgumentType.NUMBER}, {argumentType: FunctionArgumentType.NUMBER}, {argumentType: FunctionArgumentType.NUMBER}, {argumentType: FunctionArgumentType.NUMBER}, {argumentType: FunctionArgumentType.NUMBER}, {
      argumentType: FunctionArgumentType.NUMBER,
      defaultValue: 2,
      optionalArg: true
    }, {argumentType: FunctionArgumentType.BOOLEAN, defaultValue: false, optionalArg: true}],
  }
}

export const CustomFunctionPluginTranslations = {
  enGB: {
    VALUE: 'VALUE', VDB: 'VDB',
  }, enUS: {
    VALUE: 'VALUE', VDB: 'VDB',
  }
}