import { runEngineSerializationBenchmark } from './engine-serialization-benchmark'

(() => {
  const result = runEngineSerializationBenchmark()
  console.table(result.map(e => ({
    name: e.name,
    totalTime: e.totalTime
  })))
})()
