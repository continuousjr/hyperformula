import { runBasicBenchmark } from './basic-benchmark'
import { runCrudsBenchmark } from './cruds-benchmark'
import { runEngineSerializationBenchmark } from './engine-serialization-benchmark'
import fs = require('fs')

(() => {
  const filename = process.argv[2]

  if (!filename) {
    console.log('Usage:\n$ npm run benchmark:write-to-file path/to/file.json')
    return
  }

  const basicResult = runBasicBenchmark()
  const crudsResult = runCrudsBenchmark()
  const serializationResult = runEngineSerializationBenchmark()

  const allBenchmarksResult = [...basicResult, ...crudsResult, ...serializationResult].map(e => ({
    name: e.name,
    totalTime: e.totalTime
  }))

  try {
    fs.writeFileSync(filename, JSON.stringify(allBenchmarksResult))
  } catch (err) {
    console.error(err)
  }
})()
