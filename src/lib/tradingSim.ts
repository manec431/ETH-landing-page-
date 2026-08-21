import type { TimeframeZones } from './fibonacci'

export const STARTING_BALANCE = 1000
export const STORAGE_KEY = 'aether-fib-sim-v1'
/** Local clock hour for daily P&L snapshot (8:00 PM). */
export const PN_L_HOUR = 20

export type TradeSide = 'buy' | 'sell'

export type SimTrade = {
  id: string
  at: number
  dateKey: string
  side: TradeSide
  price: number
  eth: number
  usd: number
  reason: string
  buyZone: { low: number; high: number }
  sellZone: { low: number; high: number }
}

export type DailySnapshot = {
  dateKey: string
  /** Mark-to-market equity at (or after) 8pm local */
  equity: number
  cash: number
  eth: number
  markPrice: number
  dayPnL: number
  dayPnLPct: number
  recordedAt: number
}

export type SimState = {
  version: 1
  startedAt: number
  startDateKey: string
  startingBalance: number
  cash: number
  eth: number
  trades: SimTrade[]
  dailySnapshots: DailySnapshot[]
  /** Local day we already bought (all-in) */
  lastBuyDateKey: string | null
  /** Local day we already sold (flat) */
  lastSellDateKey: string | null
  /** Last calendar day an 8pm snapshot was taken */
  lastSnapshotDateKey: string | null
}

export function localDateKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function equity(cash: number, eth: number, spot: number): number {
  return cash + eth * spot
}

export function createInitialState(now = new Date()): SimState {
  return {
    version: 1,
    startedAt: now.getTime(),
    startDateKey: localDateKey(now),
    startingBalance: STARTING_BALANCE,
    cash: STARTING_BALANCE,
    eth: 0,
    trades: [],
    dailySnapshots: [],
    lastBuyDateKey: null,
    lastSellDateKey: null,
    lastSnapshotDateKey: null,
  }
}

export function loadSimState(): SimState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    const parsed = JSON.parse(raw) as Partial<SimState> & { version?: number }
    if (parsed.version !== 1 || typeof parsed.cash !== 'number') {
      return createInitialState()
    }
    return {
      ...createInitialState(),
      ...parsed,
      version: 1,
      trades: parsed.trades ?? [],
      dailySnapshots: parsed.dailySnapshots ?? [],
      lastBuyDateKey: parsed.lastBuyDateKey ?? null,
      lastSellDateKey: parsed.lastSellDateKey ?? null,
      lastSnapshotDateKey: parsed.lastSnapshotDateKey ?? null,
    }
  } catch {
    return createInitialState()
  }
}

export function saveSimState(state: SimState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Daily Fib bot (paper):
 * - Buy all cash → ETH when spot ≤ Fib buy-zone high (once per local day)
 * - Sell all ETH → cash when spot ≥ Fib sell-zone low (once per local day)
 */
export function maybeRunDailyTrade(
  state: SimState,
  spot: number,
  dailyZones: Pick<TimeframeZones, 'buyZone' | 'sellZone'>,
  now = new Date(),
): SimState {
  const dateKey = localDateKey(now)
  if (dateKey < state.startDateKey) return state
  if (!(spot > 0)) return state

  let cash = state.cash
  let eth = state.eth
  let lastBuyDateKey = state.lastBuyDateKey
  let lastSellDateKey = state.lastSellDateKey
  const trades = [...state.trades]
  const { buyZone, sellZone } = dailyZones
  let changed = false

  const canSell = lastSellDateKey !== dateKey && eth > 0 && spot >= sellZone.low
  const canBuy = lastBuyDateKey !== dateKey && cash > 1 && spot <= buyZone.high

  if (canSell) {
    const usd = eth * spot
    trades.push({
      id: uid(),
      at: now.getTime(),
      dateKey,
      side: 'sell',
      price: spot,
      eth,
      usd,
      reason: `Daily Fib sell: spot ≥ sell zone ${formatBand(sellZone)}`,
      buyZone: { ...buyZone },
      sellZone: { ...sellZone },
    })
    cash += usd
    eth = 0
    lastSellDateKey = dateKey
    changed = true
  } else if (canBuy) {
    const spent = cash
    const bought = spent / spot
    trades.push({
      id: uid(),
      at: now.getTime(),
      dateKey,
      side: 'buy',
      price: spot,
      eth: bought,
      usd: spent,
      reason: `Daily Fib buy: spot ≤ buy zone ${formatBand(buyZone)}`,
      buyZone: { ...buyZone },
      sellZone: { ...sellZone },
    })
    eth += bought
    cash = 0
    lastBuyDateKey = dateKey
    changed = true
  }

  if (!changed) return state

  return {
    ...state,
    cash,
    eth,
    trades,
    lastBuyDateKey,
    lastSellDateKey,
  }
}

function formatBand(z: { low: number; high: number }): string {
  return `${Math.round(z.low)}–${Math.round(z.high)}`
}

/** Record mark-to-market P&L once at/after 8pm local each day. */
export function maybeRecordEightPmPnL(
  state: SimState,
  spot: number,
  now = new Date(),
): SimState {
  const dateKey = localDateKey(now)
  if (dateKey < state.startDateKey) return state
  if (state.lastSnapshotDateKey === dateKey) return state
  if (now.getHours() < PN_L_HOUR) return state
  if (!(spot > 0)) return state

  const eq = equity(state.cash, state.eth, spot)
  const prev =
    state.dailySnapshots.length > 0
      ? state.dailySnapshots[state.dailySnapshots.length - 1].equity
      : state.startingBalance
  const dayPnL = eq - prev
  const dayPnLPct = prev !== 0 ? (dayPnL / prev) * 100 : 0

  const snap: DailySnapshot = {
    dateKey,
    equity: eq,
    cash: state.cash,
    eth: state.eth,
    markPrice: spot,
    dayPnL,
    dayPnLPct,
    recordedAt: now.getTime(),
  }

  return {
    ...state,
    dailySnapshots: [...state.dailySnapshots, snap],
    lastSnapshotDateKey: dateKey,
  }
}

export function resetSimState(now = new Date()): SimState {
  const fresh = createInitialState(now)
  saveSimState(fresh)
  return fresh
}

export function tickSimulation(
  state: SimState,
  spot: number,
  dailyZones: Pick<TimeframeZones, 'buyZone' | 'sellZone'> | null,
  now = new Date(),
): SimState {
  let next = state
  if (dailyZones) {
    next = maybeRunDailyTrade(next, spot, dailyZones, now)
  }
  next = maybeRecordEightPmPnL(next, spot, now)
  return next
}
