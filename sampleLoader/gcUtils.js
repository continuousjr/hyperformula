export function performGarbageCollection() {
  if (global.gc) {
    global.gc()
  } else {
    console.warn('Garbage collection not enabled.  Run with --expose-gc to enable.')
  }
}

export function getMemoryUsage() {
  performGarbageCollection()

  return _getMemUsage()
}

export function memDelta(usageBefore, usageAfter) {
  return {
    heapTotal: usageAfter.heapTotal - usageBefore.heapTotal,
    heapUsed: usageAfter.heapUsed - usageBefore.heapUsed
  }
}

function _getMemUsage() {
  const {heapTotal, heapUsed} = process.memoryUsage()
  return {
    heapTotal: toMegabytes(heapTotal),
    heapUsed: toMegabytes(heapUsed),
  }
}

function toMegabytes(bytes) {
  return bytes / 1024 / 1024
}
