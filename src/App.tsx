import { useState } from 'react'
import { Hero } from './components/Hero'
import { PriceStats } from './components/PriceStats'
import {
  PriceChart,
  type RangeDays,
} from './components/PriceChart'
import { FibZones } from './components/FibZones'
import { TradingSim } from './components/TradingSim'
import {
  useEthPrice,
  useMarketChart,
  useFibMarketData,
} from './hooks/useEthData'
import { useTradingSim } from './hooks/useTradingSim'
import { buildChartSeries } from './lib/analytics'

export default function App() {
  const { price, error, loading, updatedAt, refresh } = useEthPrice()
  const [days, setDays] = useState<RangeDays>(30)
  const { points, error: chartError, loading: chartLoading } =
    useMarketChart(days)
  const {
    shortPoints,
    longPoints,
    error: fibError,
    loading: fibLoading,
  } = useFibMarketData()

  const [showOls, setShowOls] = useState(false)
  const [showMa, setShowMa] = useState(false)

  const {
    state: simState,
    dailyZones,
    markEquity,
    reset: resetSim,
  } = useTradingSim({
    spot: price?.usd ?? null,
    shortPoints,
    longPoints,
  })

  const series = buildChartSeries(points, {
    showOls,
    showMa,
    projectionPct: null,
    horizonDays: 0,
  })

  return (
    <div id="top" className="min-h-screen bg-void">
      <Hero />
      <main>
        <PriceStats
          price={price}
          loading={loading}
          error={error}
          updatedAt={updatedAt}
          onRefresh={() => void refresh()}
        />
        <PriceChart
          series={series}
          days={days}
          onDaysChange={setDays}
          loading={chartLoading}
          error={chartError}
          showOls={showOls}
          showMa={showMa}
          onToggleOls={() => setShowOls((v) => !v)}
          onToggleMa={() => setShowMa((v) => !v)}
        />
        <FibZones
          shortPoints={shortPoints}
          longPoints={longPoints}
          spot={price?.usd ?? null}
          loading={fibLoading}
          error={fibError}
        />
        <TradingSim
          state={simState}
          spot={price?.usd ?? null}
          markEquity={markEquity}
          dailyZones={dailyZones}
          onReset={resetSim}
        />
      </main>
      <footer className="border-t border-line px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-xs tracking-[0.28em] text-glow uppercase">
            Aether
          </p>
          <p className="max-w-xl text-xs leading-relaxed text-mist">
            Market data from CoinGecko. Fibonacci levels and the paper trading
            bot are transparent simulations — not financial advice or AI price
            predictions.
          </p>
        </div>
      </footer>
    </div>
  )
}
