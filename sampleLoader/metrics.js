import {getMemoryUsage, memDelta} from './gcUtils.js';

const DURATION_PADDING = 8
const MEM_PADDING = 10
const DEPTH_PADDING = 2

/**
 *
 */
export function createMetrics() {
  const savedMetrics = []
  let depth = 0
  let parent

  /**
   *
   */
  function start(name, captureRam, report = true) {
    console.debug(`${''.padStart(depth * DEPTH_PADDING)}Start: ${name}`)

    const newMetric = {
      name,
      parent,
      depth: depth++,
      start: Date.now(),
      children: [],
      report
    }

    if (parent) {
      parent.children.push(newMetric)
    }

    if (captureRam) {
      newMetric.memBefore = getMemoryUsage()
    }

    savedMetrics.push(newMetric)

    parent = newMetric
  }

  /**
   *
   */
  function end(name) {
    const end = Date.now()

    const savedMetric = lookupMetric(name)
    console.debug(`${''.padStart(--depth * DEPTH_PADDING)}End: ${name}`)

    savedMetric.end = end
    if (savedMetric.children.length > 0) {
      // Use sum of children's durations to exclude children's GC time
      savedMetric.duration = savedMetric.children.reduce((total, child) => {
        return total + child.duration
      }, 0)
    } else {
      savedMetric.duration = savedMetric.end - savedMetric.start
    }

    if (savedMetric.memBefore) {
      savedMetric.memAfter = getMemoryUsage()
    }

    parent = savedMetric.parent
  }

  /**
   *
   */
  function print(metricOrName, namePadding, suppressHeaders) {
    const metric = typeof (metricOrName) === 'string' ? lookupMetric(metricOrName) : metricOrName

    const {name, depth, end, duration, memBefore, memAfter} = metric
    namePadding = (namePadding || name.length) - depth * DEPTH_PADDING

    let result = ` ${padText('NOT FINISHED', DURATION_PADDING + 3 + MEM_PADDING + 3 + MEM_PADDING)} |`
    if (end) {
      const metricDuration = ((duration) / 1000.0).toFixed(2) + 'S'
      const delta = memBefore ? memDelta(memBefore, memAfter) : undefined
      const usageDelta = delta ? delta.heapUsed.toFixed(2) + 'MB' : ''
      const startMem = memBefore ? memBefore.heapUsed.toFixed(2) + 'MB' : ''
      const endMem = memAfter ? memAfter.heapUsed.toFixed(2) + 'MB' : ''
      const reserved = memAfter ? memAfter.heapTotal.toFixed(2) + 'MB' : ''
      result = `${padText(metricDuration, DURATION_PADDING)} | ${padText(startMem, MEM_PADDING)} | ${padText(endMem, MEM_PADDING)} | ${padText(usageDelta, MEM_PADDING)} | ${padText(reserved, MEM_PADDING)} |`
    }

    if (!suppressHeaders) {
      printHeaders(namePadding)
    }

    console.info(`| ${''.padStart(depth * DEPTH_PADDING)}${padText(name, namePadding)} | ${result}`)
  }

  /**
   *
   */
  function printAll() {
    const metrics = savedMetrics
      .filter(m => m.report)
      .sort(m => m.start)
    const nameColLength = metrics.reduce((max, metric) => {
      return Math.max(max, metric.name.length + (metric.depth * DEPTH_PADDING))
    }, 0)

    printHeaders(nameColLength)
    metrics.forEach((metric) => {
      print(metric, nameColLength, true)
    })
  }

  /**
   *
   */
  function lookupMetric(name) {
    const metric = savedMetrics.find(m => m.name === name)
    if (!metric) {
      throw new Error(`Unknown metric: ${name}`)
    }

    return metric
  }

  /**
   *
   */
  function printHeaders(namePadding) {
    console.info(`| ${(padText('NAME', namePadding))} | ${padText('DURATION', DURATION_PADDING)} | ${padText('START MEM', MEM_PADDING)} | ${padText('END MEM', MEM_PADDING)} | ${padText('MEM DELTA', MEM_PADDING)} | ${padText('RESERVED', MEM_PADDING)} |`)
  }


  /**
   *
   */
  function padText(text, padding) {
    return (text || '').padEnd(padding, ' ');
  }


  return {
    start,
    end,
    print,
    printAll
  }
}