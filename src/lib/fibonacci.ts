import type { ChartPoint } from './coingecko'

export type TimeframeKey =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'

export type FibLevel = {
  ratio: number
  label: string
  price: number
  kind: 'retracement' | 'extension'
}

export type Pressure = {
  buyShare: number
  sellShare: number
  net: 'buy' | 'sell' | 'balanced'
  totalVolume: number
}

export type TimeframeZones = {
  key: TimeframeKey
  label: string
  lookbackDays: number
  spot: number
  swingLow: number
  swingHigh: number
  trend: 'up' | 'down' | 'sideways'
  rangeChangePct: number
  /** Illustrative low / support cluster (Fib buy zone) */
  buyZone: { low: number; high: number }
  /** Illustrative high / resistance cluster (Fib sell zone) */
  sellZone: { low: number; high: number }
  /** Suggested illustrative high & low from Fib structure */
  projectedHigh: number
  projectedLow: number
  levels: FibLevel[]
  pressure: Pressure
  method: string
}

const RETRACEMENT_RATIOS = [0.236, 0.382, 0.5, 0.618, 0.786] as const
const EXTENSION_RATIOS = [1.272, 1.618, 2.0, 2.618] as const

export const TIMEFRAMES: {
  key: TimeframeKey
  label: string
  lookbackDays: number
}[] = [
  { key: 'daily', label: 'Daily', lookbackDays: 1 },
  { key: 'weekly', label: 'Weekly', lookbackDays: 7 },
  { key: 'monthly', label: 'Monthly', lookbackDays: 30 },
  { key: 'quarterly', label: 'Quarterly', lookbackDays: 90 },
  { key: 'yearly', label: 'Yearly', lookbackDays: 365 },
]

function sliceLookback(
  points: ChartPoint[],
  lookbackDays: number,
): ChartPoint[] {
  if (points.length === 0) return []
  const end = points[points.length - 1].timestamp
  const start = end - lookbackDays * 86_400_000
  const sliced = points.filter((p) => p.timestamp >= start)
  return sliced.length >= 2 ? sliced : points.slice(-Math.min(points.length, 8))
}

function classifyTrend(
  first: number,
  last: number,
  swingLow: number,
  swingHigh: number,
): 'up' | 'down' | 'sideways' {
  const range = swingHigh - swingLow
  if (range <= 0) return 'sideways'
  const move = last - first
  const threshold = range * 0.08
  if (move > threshold) return 'up'
  if (move < -threshold) return 'down'
  return 'sideways'
}

/** Volume tagged by price direction → buy vs sell pressure share. */
export function computeVolumePressure(points: ChartPoint[]): Pressure {
  let buy = 0
  let sell = 0

  for (let i = 1; i < points.length; i++) {
    const vol = points[i].volume ?? 0
    const delta = points[i].price - points[i - 1].price
    if (delta > 0) buy += vol
    else if (delta < 0) sell += vol
    else {
      buy += vol / 2
      sell += vol / 2
    }
  }

  const total = buy + sell
  if (total <= 0) {
    return { buyShare: 0.5, sellShare: 0.5, net: 'balanced', totalVolume: 0 }
  }

  const buyShare = buy / total
  const sellShare = sell / total
  const net =
    buyShare - sellShare > 0.06
      ? 'buy'
      : sellShare - buyShare > 0.06
        ? 'sell'
        : 'balanced'

  return { buyShare, sellShare, net, totalVolume: total }
}

/**
 * Classic Fib from swing low → swing high (impulse).
 * Retracements measure pullbacks into the range; extensions project beyond the high.
 */
function fibFromImpulse(swingLow: number, swingHigh: number): FibLevel[] {
  const range = swingHigh - swingLow
  if (range <= 0) return []

  const levels: FibLevel[] = RETRACEMENT_RATIOS.map((ratio) => ({
    ratio,
    label: `${(ratio * 100).toFixed(1)}%`,
    // Price at retracement from high back toward low
    price: swingHigh - range * ratio,
    kind: 'retracement' as const,
  }))

  for (const ratio of EXTENSION_RATIOS) {
    levels.push({
      ratio,
      label: `${ratio.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}x`,
      price: swingLow + range * ratio,
      kind: 'extension',
    })
  }

  return levels.sort((a, b) => a.price - b.price)
}

/**
 * Build transparent Fib buy/sell zones for one lookback window.
 * Not a forecast model — geometric levels from observed swing structure + volume tags.
 */
export function analyzeTimeframe(
  allPoints: ChartPoint[],
  meta: { key: TimeframeKey; label: string; lookbackDays: number },
  spotOverride?: number,
): TimeframeZones | null {
  const points = sliceLookback(allPoints, meta.lookbackDays)
  if (points.length < 2) return null

  let swingLow = points[0].price
  let swingHigh = points[0].price
  for (const p of points) {
    if (p.price < swingLow) swingLow = p.price
    if (p.price > swingHigh) swingHigh = p.price
  }

  const first = points[0].price
  const last = points[points.length - 1].price
  const spot = spotOverride ?? last
  const trend = classifyTrend(first, last, swingLow, swingHigh)
  const rangeChangePct = ((last - first) / first) * 100
  const levels = fibFromImpulse(swingLow, swingHigh)
  const pressure = computeVolumePressure(points)

  // Buy zone: deep retracements (0.618–0.786) — support cluster
  const r618 = swingHigh - (swingHigh - swingLow) * 0.618
  const r786 = swingHigh - (swingHigh - swingLow) * 0.786
  const buyLow = Math.min(r618, r786, swingLow)
  const buyHigh = Math.max(r618, r786)

  // Sell zone: extension cluster 1.272–1.618 (or near swing high if still inside range)
  const e1272 = swingLow + (swingHigh - swingLow) * 1.272
  const e1618 = swingLow + (swingHigh - swingLow) * 1.618
  const sellLow = Math.min(e1272, swingHigh)
  const sellHigh = Math.max(e1272, e1618)

  // Illustrative projected high/low for the window
  const projectedHigh =
    trend === 'down'
      ? Math.max(swingHigh, spot)
      : e1618
  const projectedLow =
    trend === 'up'
      ? Math.min(r618, spot)
      : Math.min(swingLow, r786)

  // Mild volume bias: widen the favored zone slightly toward pressure
  let buyZone = { low: buyLow, high: buyHigh }
  let sellZone = { low: sellLow, high: sellHigh }
  if (pressure.net === 'buy') {
    buyZone = {
      low: buyLow,
      high: Math.min(buyHigh + (buyHigh - buyLow) * 0.15, spot),
    }
  } else if (pressure.net === 'sell') {
    sellZone = {
      low: Math.max(sellLow - (sellHigh - sellLow) * 0.15, spot),
      high: sellHigh,
    }
  }

  return {
    key: meta.key,
    label: meta.label,
    lookbackDays: meta.lookbackDays,
    spot,
    swingLow,
    swingHigh,
    trend,
    rangeChangePct,
    buyZone,
    sellZone,
    projectedHigh,
    projectedLow,
    levels,
    pressure,
    method:
      'Swing high/low Fib retracements (0.236–0.786) + extensions (1.272–2.618); volume tagged by bar direction',
  }
}

export function analyzeAllTimeframes(
  shortHorizon: ChartPoint[],
  longHorizon: ChartPoint[],
  spot?: number,
): TimeframeZones[] {
  const out: TimeframeZones[] = []
  for (const tf of TIMEFRAMES) {
    // Daily needs intraday (1d) series; longer windows use the 365d series
    const primary =
      tf.key === 'daily'
        ? shortHorizon.length > 0
          ? shortHorizon
          : longHorizon
        : longHorizon.length > 0
          ? longHorizon
          : shortHorizon
    const zone = analyzeTimeframe(primary, tf, spot)
    if (zone) out.push(zone)
  }
  return out
}
