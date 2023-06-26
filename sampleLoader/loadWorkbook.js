import ExcelJS from 'exceljs';
import {HyperFormula} from '../dist/hyperformula.full.js';

import moment from 'moment';

const {Workbook} = ExcelJS

const excelCompatibleOptions = {
  licenseKey: 'gpl-v3',
  maxColumns: 16384,
  maxRows: 1048576,
  functionArgSeparator: ',', // set by default
  decimalSeparator: '.', // set by default
  thousandSeparator: '', // set by default
  arrayColumnSeparator: ',', // set by default
  arrayRowSeparator: ';', // set by default
  dateFormats: ['MM/DD/YYYY', 'MM/DD/YY', 'YYYY/MM/DD'],
  timeFormats: ['hh:mm', 'hh:mm:ss.sss'], // set by default
  nullYear: 30, // set by default
  caseSensitive: false, // set by default
  accentSensitive: true,
  ignorePunctuation: false, // set by default
  localeLang: 'en', // set by default
  useWildcards: true, // set by default
  useRegularExpressions: false, // set by default
  matchWholeCell: true, // set by default
  useArrayArithmetic: true,
  ignoreWhiteSpace: 'any',
  evaluateNullToZero: true,
  excelCompatibleSubtotal: true,
  leapYear1900: true,
  nullDate: {year: 1899, month: 12, day: 31},
  smartRounding: true, // set by default
}

const excelNamedExpressions = [
  {name: 'TRUE', expression: '=TRUE()'},
  {name: 'FALSE', expression: '=FALSE()'},
]

/**
 *
 */
export async function loadWorkbook(filename, metrics, options = {}) {
  metrics.start('READ XLSX', true)
  const excelWorkbook = await readXlsxWorkbook(filename)
  metrics.end('READ XLSX')

  metrics.start('BUILD HF TOTAL', true)

  metrics.start('BUILD HF INSTANCE', true)
  const data = buildHfInstance(excelWorkbook, metrics, options)
  metrics.end('BUILD HF INSTANCE')

  metrics.end('BUILD HF TOTAL')

  return {
    ...data,
    excelWorkbook
  }
}

/**
 *
 */
async function readXlsxWorkbook(filename) {
  const excelWorkbook = new Workbook()
  await excelWorkbook.xlsx.readFile(filename)
  return excelWorkbook
}

/**
 *
 */
function getCellContents(sheetName, cell, options, sheetData) {
  const {value, model, address} = cell
  const overrides = options?.overrides || {}
  const sheetOverrides = overrides[sheetName] || {}
  const overrideFormula = sheetOverrides[address]
  let cellContents

  if (overrideFormula || value && typeof value === 'object') {
    let formula = value?.formula
    if (overrideFormula) {
      formula = overrideFormula
    } else if (value.sharedFormula) {
      const hfInstance = options.hfInstance
      const sheetId = hfInstance.getSheetId(sheetName)
      const sourceCell = hfInstance.simpleCellAddressFromString(value.sharedFormula, sheetId)
      const targetCell = hfInstance.simpleCellAddressFromString(address, sheetId)
      const rowOffset = targetCell.row - sourceCell.row
      const colOffset = targetCell.col - sourceCell.col

      const rowContents = sheetData[sourceCell.row]
      const baseFormula = rowContents[sourceCell.col]

      formula = baseFormula
      .substring(1) // Strip leading '='
      .replace(/((([a-zA-Z0-9()]+)|('[^']+'))!)?(\$?([A-Z])){1,2}(\$?([0-9]+))/g, (substring, ...args) => {
        const baseAddress = hfInstance.simpleCellAddressFromString(substring, sheetId)
        const row = args[4]
        const col = args[6]
        const colIsAbsolute = row.startsWith('$')
        const rowIsAbsolute = col.startsWith('$')

        const newAddress = {
          ...baseAddress,
          row: rowIsAbsolute ? baseAddress.row : baseAddress.row + rowOffset,
          col: colIsAbsolute ? baseAddress.col : baseAddress.col + colOffset
        }

        let newCellRef = hfInstance.simpleCellAddressToString(newAddress, sheetId)
        if (colIsAbsolute) {
          newCellRef = '$' + newCellRef
        }

        if (rowIsAbsolute) {
          newCellRef = newCellRef.replace(/([A-Z])([0-9])/, '$1$$$2')
        }

        return newCellRef
      })
    }


    if (formula) {
      cellContents = massageExcelFormula(formula, sheetName, overrides)
    } else if (value instanceof Date) {
      const dateAsMoment = moment(value)
      const offset = dateAsMoment.utcOffset()
      cellContents = moment(value).subtract(offset, 'minutes').toDate()
    } else if (value?.error) {
      cellContents = value.error
    } else if (value?.richText) {
      cellContents = value.richText.join('')
    }
  } else {
    if (value?.startsWith && value.startsWith('=')) {
      cellContents = `'${value}`
    } else {
      cellContents = value
    }
  }

  if (typeof cellContents === 'undefined') {
    throw new Error(`Undefined value ${JSON.stringify(cell.fullAddress)} : ${JSON.stringify({value, model})}`)
  }

  return cellContents
}

/**
 *
 */
function massageExcelFormula(origFormula, sheetName, overrides) {
  const replacements = overrides.replacements || []
  const variableValues = {...(overrides.variableValues || {}), SHEET_NAME: sheetName}

  const formula = `=${origFormula}`

  return replacements.reduce((result, item) => {
    const {regex, value, replacement, variables} = item

    if (regex) {
      const RE = lookupRegex(overrides, regex, 'g')
      const variableMatchIndices = {...(variables || {}), SHEET_NAME: -1}

      result = result.replace(RE, (substring, ...args) => {
        if (variables) {
          const resolvedReplacement = Object.keys(variableMatchIndices).reduce((result, variableName) => {
            const variableKeyIndex = variableMatchIndices[variableName]
            let sheetValue

            if (variableKeyIndex === -1) {
              sheetValue = variableValues[variableName]
            } else {
              const variableKey = args[variableKeyIndex]
              const sheetValues = variableValues[variableName]
              sheetValue = sheetValues[variableKey] || sheetValues['__default']
            }

            return result.replaceAll(`{${variableName}}`, sheetValue)
          }, replacement)

          return substring.replace(RE, resolvedReplacement)
        } else {
          return replacement
        }
      })
    } else {
      result = result.replaceAll(value, replacement)
    }

    return result
  }, formula)
}

/**
 *
 */
function lookupRegex(overrides, regex, reFlags) {
  if (!overrides.regExMemo) {
    overrides.regExMemo = {}
  }

  if (!overrides.regExMemo[regex]) {
    overrides.regExMemo[regex] = new RegExp(regex, reFlags)
  }

  return overrides.regExMemo[regex]
}

/**
 *
 */
function buildRawSheetData(worksheet, options) {
  const sheetData = []

  let nextRow = 1
  worksheet.eachRow((row) => {
    if (row.number > nextRow) {
      for (let i = nextRow; i < row.number; i++) {
        sheetData.push([])
      }
    }

    nextRow = row.number + 1
    const rowData = []
    sheetData.push(rowData)

    let nextCol = 1
    row.eachCell((cell) => {
      if (cell.fullAddress.col > nextCol) {
        for (let i = nextCol; i < cell.fullAddress.col; i++) {
          rowData.push(null)
        }
      }

      nextCol = cell.fullAddress.col + 1

      const cellData = getCellContents(worksheet.name, cell, options, sheetData)
      rowData.push(cellData)
    })
  })

  return sheetData
}

/**
 *
 */
function buildHfInstance(excelWorkbook, metrics, options) {
  const hfInstance = HyperFormula.buildEmpty(excelCompatibleOptions, excelNamedExpressions)
  options.hfInstance = hfInstance

  const allSheetData = {}
  metrics.start('CREATE SHEETS')
  excelWorkbook.eachSheet((worksheet) => {
    const sheetName = hfInstance.addSheet(worksheet.name)

    hfInstance.setCellContents({
      row: 1,
      col: worksheet.columnCount,
      sheet: hfInstance.getSheetId(sheetName)
    }, '')
  })
  metrics.end('CREATE SHEETS')

  metrics.start('POPULATE SHEETS')
  excelWorkbook.eachSheet((worksheet) => {
    const sheetName = worksheet.name
    metrics.start(`SHEET: ${sheetName}`, false, false)

    const sheetId = hfInstance.getSheetId(sheetName)

    hfInstance.suspendEvaluation()
    metrics.start(`BUILD SHEET ${sheetName}`, false, false)

    metrics.start(`LOAD SHEET ${sheetName}`, false, false)
    const sheetData = buildRawSheetData(worksheet, options)
    allSheetData[sheetName] = sheetData
    metrics.end(`LOAD SHEET ${sheetName}`, false, false)

    try {
      metrics.start(`CREATE SHEET ${sheetName}`, false, false)
      hfInstance.setSheetContent(sheetId, sheetData)
      metrics.end(`CREATE SHEET ${sheetName}`, false, false)
    } catch (e) {
      console.error(e)
      throw new Error(`Failed to build sheet ${sheetName}`)
    }

    metrics.end(`BUILD SHEET ${sheetName}`)

    metrics.start(`RECALC ${sheetName}`, false, false)
    hfInstance.resumeEvaluation()
    metrics.end(`RECALC ${sheetName}`)

    metrics.end(`SHEET: ${sheetName}`)
  })

  metrics.end('POPULATE SHEETS')

  return {
    hfInstance,
    sheetData: allSheetData
  }
}
