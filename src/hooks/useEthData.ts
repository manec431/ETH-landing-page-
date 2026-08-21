import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchEthPrice,
  fetchMarketChart,
  type ChartPoint,
  type EthPrice,
} from '../lib/coingecko'

const PRICE_REFRESH_MS = 45_000

export function useEthPrice() {
  const [price, setPrice] = useState<EthPrice | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const mounted = useRef(true)

  const load = useCallback(async () => {
    try {
      const data = await fetchEthPrice()
      if (!mounted.current) return
      setPrice(data)
      setError(null)
      setUpdatedAt(new Date())
    } catch (e) {
      if (!mounted.current) return
      setError(e instanceof Error ? e.message : 'Failed to load price')
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    void load()
    const id = window.setInterval(() => void load(), PRICE_REFRESH_MS)
    return () => {
      mounted.current = false
      window.clearInterval(id)
    }
  }, [load])

  return { price, error, loading, updatedAt, refresh: load }
}

export function useMarketChart(days: number) {
  const [points, setPoints] = useState<ChartPoint[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    void (async () => {
      try {
        const data = await fetchMarketChart(days)
        if (cancelled) return
        setPoints(data)
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to load chart')
        setPoints([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [days])

  return { points, error, loading }
}
