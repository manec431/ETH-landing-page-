import { useEffect, useState } from 'react'
import { analyzeTimeframe, TIMEFRAMES } from '../lib/fibonacci'
import type { ChartPoint } from '../lib/coingecko'
import type { TimeframeZones } from '../lib/fibonacci'
import {
  equity,
  loadSimState,
  resetSimState,
  saveSimState,
  tickSimulation,
  type SimState,
} from '../lib/tradingSim'

type Args = {
  spot: number | null
  shortPoints: ChartPoint[]
  longPoints: ChartPoint[]
}

function getDailyZones(
  shortPoints: ChartPoint[],
  longPoints: ChartPoint[],
  spot: number | null,
): TimeframeZones | null {
  const dailyMeta = TIMEFRAMES.find((t) => t.key === 'daily')!
  const source = shortPoints.length > 0 ? shortPoints : longPoints
  if (source.length < 2) return null
  return analyzeTimeframe(source, dailyMeta, spot ?? undefined)
}

export function useTradingSim({ spot, shortPoints, longPoints }: Args) {
  const [state, setState] = useState<SimState | null>(null)
  const dailyZones = getDailyZones(shortPoints, longPoints, spot)

  useEffect(() => {
    setState(loadSimState())
  }, [])

  useEffect(() => {
    if (state == null || spot == null) return

    const zones = getDailyZones(shortPoints, longPoints, spot)
    const next = tickSimulation(state, spot, zones)
    if (next === state) return

    saveSimState(next)
    setState(next)
  }, [
    state,
    spot,
    shortPoints,
    longPoints,
    dailyZones?.buyZone.high,
    dailyZones?.buyZone.low,
    dailyZones?.sellZone.low,
    dailyZones?.sellZone.high,
  ])

  useEffect(() => {
    if (spot == null) return

    const id = window.setInterval(() => {
      setState((prev) => {
        if (!prev) return prev
        const zones = getDailyZones(shortPoints, longPoints, spot)
        const next = tickSimulation(prev, spot, zones)
        if (next === prev) return prev
        saveSimState(next)
        return next
      })
    }, 60_000)

    return () => window.clearInterval(id)
  }, [spot, shortPoints, longPoints])

  const reset = () => {
    setState(resetSimState())
  }

  const markEquity =
    state && spot != null ? equity(state.cash, state.eth, spot) : null

  return { state, dailyZones, markEquity, reset }
}
