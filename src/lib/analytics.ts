import type { ChartPoint } from './coingecko'

export type SeriesPoint = {
  timestamp: number
  price: number | null
  ma7: number | null
  ma25: number | null
  ols: number | null
  projection: number | null
}

/** Ordinary least squares linear regression over price vs time. */
export function computeOlsTrend(
  points: ChartPoint[],
): { slope: number; intercept: number } | null {
  const n = points.length
  if (n < 2) return null

  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumXX = 0

  for (const p of points) {
    const x = p.timestamp
    const y = p.price
    sumX += x
    sumY += y
    sumXY += x * y
    sumXX += x * x
  }

  const denom = n * sumXX - sumX * sumX
  if (denom === 0) return null

  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n
  return { slope, intercept }
}

/** Approximate samples-per-day from the series spacing, then MA over N days. */
export function movingAverageDays(
  points: ChartPoint[],
  dayWindow: number,
): (number | null)[] {
  if (points.length < 2) return points.map(() => null)

  const spanMs = points[points.length - 1].timestamp - points[0].timestamp
  const spanDays = Math.max(spanMs / 86_400_000, 1 / 24)
  const samplesPerDay = points.length / spanDays
  const window = Math.max(2, Math.round(samplesPerDay * dayWindow))

  return points.map((_, i) => {
    if (i + 1 < window) return null
    let sum = 0
    for (let j = i - window + 1; j <= i; j++) {
      sum += points[j].price
    }
    return sum / window
  })
}

export function projectPrice(
  current: number,
  percentChange: number,
): number {
  return current * (1 + percentChange / 100)
}

/** Extend historical series with optional OLS fit, MAs, and scenario projection. */
export function buildChartSeries(
  points: ChartPoint[],
  options: {
    showOls: boolean
    showMa: boolean
    projectionPct: number | null
    horizonDays: number
  },
): SeriesPoint[] {
  if (points.length === 0) return []

  const ols = options.showOls ? computeOlsTrend(points) : null
  const ma7 = options.showMa ? movingAverageDays(points, 7) : null
  const ma25 = options.showMa ? movingAverageDays(points, 25) : null

  const series: SeriesPoint[] = points.map((p, i) => ({
    timestamp: p.timestamp,
    price: p.price,
    ma7: ma7 ? ma7[i] : null,
    ma25: ma25 ? ma25[i] : null,
    ols: ols ? ols.intercept + ols.slope * p.timestamp : null,
    projection: null,
  }))

  if (options.projectionPct !== null && points.length > 0) {
    const last = points[points.length - 1]
    const target = projectPrice(last.price, options.projectionPct)
    const msPerDay = 86_400_000
    const endTs = last.timestamp + options.horizonDays * msPerDay

    // Anchor projection at last known price so the dashed line continues cleanly
    series[series.length - 1] = {
      ...series[series.length - 1],
      projection: last.price,
    }

    const steps = Math.max(4, Math.min(options.horizonDays, 30))
    for (let s = 1; s <= steps; s++) {
      const t = s / steps
      const timestamp = last.timestamp + t * (endTs - last.timestamp)
      const price = last.price + t * (target - last.price)
      series.push({
        timestamp,
        price: null,
        ma7: null,
        ma25: null,
        ols: ols ? ols.intercept + ols.slope * timestamp : null,
        projection: price,
      })
    }
  }

  return series
}
