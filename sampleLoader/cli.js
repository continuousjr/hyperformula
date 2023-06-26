import fs from 'fs';
import {processWorkbook} from './processWorkbook.js';
import {CustomFunctionPlugin, CustomFunctionPluginTranslations} from './customFunctionPlugin.js';
import {HyperFormula} from '../dist/hyperformula.full.js';

const args = process.argv.slice(2)

if (args.length < 1) {
  console.log('usage: node cli.js <fileName> [action] [settingsFile]')
  process.exit()
}

HyperFormula.registerFunctionPlugin(CustomFunctionPlugin, CustomFunctionPluginTranslations)

const fileName = args[0]
const action = args[1] || 'measure' // 'measure' or 'compare'
const settingsFile = args.length > 2 && args[2]

const defaultOptions = {
  overrides: {}
}

let options = {}

if (settingsFile) {
  const optionsContent = fs.readFileSync(settingsFile, {encoding: 'utf-8'})
  options = JSON.parse(optionsContent)
}

(async () => {
  await processWorkbook(fileName, action, {...defaultOptions, ...options})

  console.log(`Done processing workbook ${fileName}`)
})()
