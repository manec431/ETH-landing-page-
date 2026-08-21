import type { ChartPoint } from './coingecko'

export type RollingKey = 'daily' | 'weekly' | 'monthly'
export type YearKey = `year-${number}`
export type TimeframeKey = RollingKey | YearKey

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
  /** Calendar year when this is a year tab; null for rolling windows */
  calendarYear: number | null
  /** Years ahead of the current calendar year (0 = this year) */
  yearsOut: number | null
  spot: number
  swingLow: number
  swingHigh: number
  trend: 'up' | 'down' | 'sideways'
  rangeChangePct: number
  buyZone: { low: number; high: number }
  sellZone: { low: number; high: number }
  projectedHigh: number
  projectedLow: number
  levels: FibLevel[]
  pressure: Pressure
  method: string
}

export type TimeframeMeta = {
  key: TimeframeKey
  label: string
  kind: 'rolling' | 'year'
  lookbackDays: number
  calendarYear: number | null
  yearsOut: number | null
}

const YEAR_EXT_STEPS = [1.272, 1.618, 2.0, 2.618, 3.618, 4.236, 6.854] as const

/** How many calendar years beyond the current year to show (inclusive span = 1 + this). */
export const YEARS_OUT = 5

export function currentCalendarYear(now = new Date()): number {
  return now.getFullYear()
}

/** Daily / weekly / monthly + labeled years: this year through +YEARS_OUT. */
export function getTimeframes(now = new Date()): TimeframeMeta[] {
  const year = currentCalendarYear(now)
  const startOfYear = new Date(year, 0, 1)
  const ytdDays = Math.max(
    1,
    Math.ceil((now.getTime() - startOfYear.getTime()) / 86_400_000),
  )

  const rolling: TimeframeMeta[] = [
    { key: 'daily', label: 'Daily', kind: 'rolling', lookbackDays: 1, calendarYear: null, yearsOut: null },
    { key: 'weekly', label: 'Weekly', kind: 'rolling', lookbackDays: 7, calendarYear: null, yearsOut: null },
    { key: 'monthly', label: 'Monthly', kind: 'rolling', lookbackDays: 30, calendarYear: null, yearsOut: null },
  ]

  const years: TimeframeMeta[] = []
  for (let out = 0; out <= YEARS_OUT; out++) {
    const y = year + out
    years.push({
      key: `year-${y}`,
      label: String(y),
      kind: 'year',
      lookbackDays: out === 0 ? ytdDays : Math.min(365, ytdDays),
      calendarYear: y,
      yearsOut: out,
    })
  }

  return [...rolling, ...years]
}

/** @deprecated Prefer getTimeframes() — kept for call sites that need daily meta. */
export const TIMEFRAMES = getTimeframes()

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

function sliceYearToDate(points: ChartPoint[], year: number): ChartPoint[] {
  const start = new Date(year, 0, 1).getTime()
  const sliced = points.filter((p) => p.timestamp >= start)
  return sliced.length >= 2 ? sliced : sliceLookback(points, 365)
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

function fibFromImpulse(swingLow: number, swingHigh: number): FibLevel[] {
  const range = swingHigh - swingLow
  if (range <= 0) return []

  const levels: FibLevel[] = [0.236, 0.382, 0.5, 0.618, 0.786].map((ratio) => ({
    ratio,
    label: `${(ratio * 100).toFixed(1)}%`,
    price: swingHigh - range * ratio,
    kind: 'retracement' as const,
  }))

  for (const ratio of YEAR_EXT_STEPS) {
    levels.push({
      ratio,
      label: `${ratio}x`,
      price: swingLow + range * ratio,
      kind: 'extension',
    })
  }

  return levels.sort((a, b) => a.price - b.price)
}

function swings(points: ChartPoint[]): {
  swingLow: number
  swingHigh: number
  first: number
  last: number
} {
  let swingLow = points[0].price
  let swingHigh = points[0].price
  for (const p of points) {
    if (p.price < swingLow) swingLow = p.price
    if (p.price > swingHigh) swingHigh = p.price
  }
  return {
    swingLow,
    swingHigh,
    first: points[0].price,
    last: points[points.length - 1].price,
  }
}

function applyPressureBias(
  buyZone: { low: number; high: number },
  sellZone: { low: number; high: number },
  pressure: Pressure,
  spot: number,
) {
  if (pressure.net === 'buy') {
    return {
      buyZone: {
        low: buyZone.low,
        high: Math.min(buyZone.high + (buyZone.high - buyZone.low) * 0.15, spot),
      },
      sellZone,
    }
  }
  if (pressure.net === 'sell') {
    return {
      buyZone,
      sellZone: {
        low: Math.max(sellZone.low - (sellZone.high - sellZone.low) * 0.15, spot),
        high: sellZone.high,
      },
    }
  }
  return { buyZone, sellZone }
}

/**
 * Rolling window (daily / weekly / monthly) Fib zones from observed swings.
 */
export function analyzeTimeframe(
  allPoints: ChartPoint[],
  meta: TimeframeMeta,
  spotOverride?: number,
): TimeframeZones | null {
  if (meta.kind === 'year' && meta.calendarYear != null) {
    return analyzeCalendarYear(allPoints, meta, spotOverride)
  }

  const points = sliceLookback(allPoints, meta.lookbackDays)
  if (points.length < 2) return null

  const { swingLow, swingHigh, first, last } = swings(points)
  const spot = spotOverride ?? last
  const trend = classifyTrend(first, last, swingLow, swingHigh)
  const rangeChangePct = ((last - first) / first) * 100
  const levels = fibFromImpulse(swingLow, swingHigh)
  const pressure = computeVolumePressure(points)
  const range = swingHigh - swingLow

  const r618 = swingHigh - range * 0.618
  const r786 = swingHigh - range * 0.786
  const e1272 = swingLow + range * 1.272
  const e1618 = swingLow + range * 1.618

  let buyZone = {
    low: Math.min(r618, r786, swingLow),
    high: Math.max(r618, r786),
  }
  let sellZone = {
    low: Math.min(e1272, swingHigh),
    high: Math.max(e1272, e1618),
  }
  ;({ buyZone, sellZone } = applyPressureBias(buyZone, sellZone, pressure, spot))

  const projectedHigh = trend === 'down' ? Math.max(swingHigh, spot) : e1618
  const projectedLow =
    trend === 'up' ? Math.min(r618, spot) : Math.min(swingLow, r786)

  return {
    key: meta.key,
    label: meta.label,
    lookbackDays: meta.lookbackDays,
    calendarYear: null,
    yearsOut: null,
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
      'Swing high/low Fib retracements (0.236–0.786) + extensions; volume tagged by bar direction',
  }
}

/**
 * Calendar-year tabs: current year uses YTD structure; future years ladder
 * Fib extensions further out (illustrative only — not forecasts).
 */
function analyzeCalendarYear(
  allPoints: ChartPoint[],
  meta: TimeframeMeta,
  spotOverride?: number,
): TimeframeZones | null {
  const year = meta.calendarYear!
  const yearsOut = meta.yearsOut ?? 0
  const nowYear = currentCalendarYear()

  // Structure always from the current year's YTD (or best available long series)
  const basePoints =
    year === nowYear
      ? sliceYearToDate(allPoints, nowYear)
      : sliceYearToDate(allPoints, nowYear).length >= 2
        ? sliceYearToDate(allPoints, nowYear)
        : sliceLookback(allPoints, 365)

  if (basePoints.length < 2) return null

  const { swingLow, swingHigh, first, last } = swings(basePoints)
  const spot = spotOverride ?? last
  const trend = classifyTrend(first, last, swingLow, swingHigh)
  const rangeChangePct = ((last - first) / first) * 100
  const levels = fibFromImpulse(swingLow, swingHigh)
  const pressure = computeVolumePressure(basePoints)
  const range = Math.max(swingHigh - swingLow, spot * 0.01)

  // Ladder extension pairs by years out: 0→1.272/1.618, 1→1.618/2.0, …
  const hiIdx = Math.min(yearsOut + 1, YEAR_EXT_STEPS.length - 1)
  const loIdx = Math.min(yearsOut, YEAR_EXT_STEPS.length - 2)
  const extLo = YEAR_EXT_STEPS[loIdx]
  const extHi = YEAR_EXT_STEPS[hiIdx]

  const sellLow = swingLow + range * extLo
  const sellHigh = swingLow + range * extHi

  // Buy / support: current year uses classic retracements; outer years use
  // a wider pullback band anchored to swing structure.
  const retDeep = yearsOut === 0 ? 0.786 : Math.min(0.5 + yearsOut * 0.05, 0.886)
  const retShallow = yearsOut === 0 ? 0.618 : Math.min(0.382 + yearsOut * 0.04, 0.786)
  const buyHigh = swingHigh - range * retShallow
  const buyLow = swingHigh - range * retDeep

  let buyZone = {
    low: Math.min(buyLow, buyHigh, swingLow),
    high: Math.max(buyLow, buyHigh),
  }
  let sellZone = {
    low: Math.min(sellLow, sellHigh),
    high: Math.max(sellLow, sellHigh),
  }
  ;({ buyZone, sellZone } = applyPressureBias(buyZone, sellZone, pressure, spot))

  const projectedHigh = sellHigh
  const projectedLow = buyZone.low

  const ytdDays = Math.max(
    1,
    Math.ceil((Date.now() - new Date(nowYear, 0, 1).getTime()) / 86_400_000),
  )

  return {
    key: meta.key,
    label: meta.label,
    lookbackDays: yearsOut === 0 ? ytdDays : ytdDays,
    calendarYear: year,
    yearsOut,
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
      yearsOut === 0
        ? `${year} year-to-date swing Fib retracements + extensions; volume by bar direction`
        : `Illustrative ${year} Fib extension ladder (${extLo}x–${extHi}x) from ${nowYear} YTD swing — not a forecast`,
  }
}

export function analyzeAllTimeframes(
  shortHorizon: ChartPoint[],
  longHorizon: ChartPoint[],
  spot?: number,
  now = new Date(),
): TimeframeZones[] {
  const out: TimeframeZones[] = []
  for (const tf of getTimeframes(now)) {
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
