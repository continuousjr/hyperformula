import {createMetrics} from './metrics.js';
import {loadWorkbook} from './loadWorkbook.js';
import {HyperFormula} from '../dist/hyperformula.full.js';

const handlers = {
  measure,
  compare
}

/**
 *
 */
export async function processWorkbook(fileName, action, options) {
  const metrics = createMetrics()

  const data = await loadWorkbook(fileName, metrics, options)

  const handler = handlers[action]
  await handler(data, metrics, options)
}

/**
 *
 */
function compare(data, metrics, options) {
  const {sheetsToReport, overrides} = options
  const excelValueOverrides = overrides?.excelValues || {}

  metrics.start('VALIDATING SHEETS')
  const {hfInstance, sheetData, excelWorkbook} = data
  const allSheetNames = hfInstance.getSheetNames()
  const sheetNamesToReport = (sheetsToReport || []).length > 0 ? sheetsToReport : allSheetNames
  const allSheetsToReport = new Set(sheetNamesToReport)
  const allDeltas = {}
  allSheetNames.forEach((sheetName) => {
    if (allSheetsToReport.has(sheetName)) {
      const excelSheet = excelWorkbook.getWorksheet(sheetName)
      const excelCells = sheetData[sheetName]
      const sheetId = hfInstance.getSheetId(sheetName)
      const sheetDeltas = []
      allDeltas[sheetName] = sheetDeltas

      excelCells.forEach((rowCells, row) => {
        rowCells.forEach((excelRawValue, col) => {
          const cellAddress = {sheet: sheetId, row, col}
          const hfValue = hfInstance.getCellValue(cellAddress)
          const hfRaw = hfInstance.getCellSerialized(cellAddress)
          const excelCell = excelSheet.getCell(row + 1, col + 1)

          const excelCellValue =
            (excelValueOverrides[excelRawValue]) ??
            (excelCell.formula ? excelCell.model.result : excelCell.value)

          const delta = compareCells(cellAddress, hfValue, hfRaw, excelCellValue, excelRawValue, hfInstance)
          if (delta) {
            sheetDeltas.push(delta)
          }
        })
      })
    }
  })
  metrics.end('VALIDATING SHEETS')
  console.log(JSON.stringify(allDeltas))
}

/**
 *
 */
function measure(data, metrics) {
  metrics.start('PURGE XLSX', true)
  delete data.excelWorkbook
  delete data.sheetData
  metrics.end('PURGE XLSX')

  let hfInstance = data.hfInstance
  delete data.hfInstance

  metrics.start('SERIALIZE HF INSTANCE', true)
  let buffer = HyperFormula.serializeEngine(hfInstance)
  metrics.end('SERIALIZE HF INSTANCE')

  metrics.start('PURGE HF INSTANCE', true)
  hfInstance = null
  metrics.end('PURGE HF INSTANCE')

  metrics.start('DESERIALIZE HF INSTANCE', true)
  hfInstance = HyperFormula.restoreEngine(buffer)
  metrics.end('DESERIALIZE HF INSTANCE')

  metrics.start('PURGE BUFFER', true)
  buffer = null
  metrics.end('PURGE BUFFER')

  metrics.start('PURGE HF INSTANCE 2', true)
  hfInstance = null
  metrics.end('PURGE HF INSTANCE 2')

  metrics.printAll()
}

/**
 *
 */
function compareCells(cellAddress, hfValue, hfRaw, excelValue, excelRaw, hfInstance) {
  let isEqual = true

  let excelActual = excelRaw
  let hfActual = hfValue

  if (typeof (excelRaw) === 'string' && excelRaw.startsWith('=')) {
    isEqual = excelRaw.replace(/'/g, '') === (hfRaw || '').replace(/'/g, '')
    excelActual = convertFormulaValue(excelValue)
  }

  if (typeof (excelActual) === 'string') {
    if (typeof (hfActual) === 'number') {
      excelActual = parseFloat(excelActual)
    } else if ((typeof (hfActual) === 'string') && excelActual.startsWith('\'') && !hfActual.startsWith('\'')) {
      hfActual = `'${hfActual}`
    }
  }

  if (isEqual) {
    if (!excelActual) {
      isEqual = !hfActual?.value
    } else if (typeof (excelActual) === 'number') {
      const difference = Math.abs(excelActual - hfActual)
      isEqual = difference < .000001
    } else if (excelActual instanceof Date) {
      if (hfRaw instanceof Date) {
        isEqual = excelActual.getTime() === hfRaw.getTime()
      } else if (typeof (hfActual) === 'number') {
        hfActual = new Date(Date.UTC(0, 0, hfValue - 1))
        isEqual = excelActual.getTime() === hfActual.getTime()
      } else {
        isEqual = excelActual === hfActual
      }
    } else if (typeof (excelActual) === 'string') {
      if (excelActual.startsWith('#')) {
        isEqual = excelActual === '#N/A' && hfValue?.value === '#NAME?' || excelActual === hfActual?.value
      } else {
        isEqual = excelActual === hfActual
      }
    } else {
      isEqual = excelActual === hfActual
    }
  }

  let delta
  if (!isEqual) {
    delta = {
      sheetName: hfInstance.getSheetName(cellAddress.sheet),
      address: hfInstance.simpleCellAddressToString(cellAddress, cellAddress.sheet),
      excelRaw,
      excelValue: excelActual,
      hfRaw,
      hfValue: hfActual
    }
  }

  return delta
}

/**
 *
 */
function convertFormulaValue(value) {
  let result

  if (value?.error) {
    result = value.error
  } else if (value?.richText) {
    result = value.richText.join('')
  } else {
    result = value || ''
  }

  return result
}


