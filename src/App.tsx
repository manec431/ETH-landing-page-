import { useState } from 'react'
import { Hero } from './components/Hero'
import { PriceStats } from './components/PriceStats'
import {
  PriceChart,
  type RangeDays,
} from './components/PriceChart'
import {
  Projections,
  type Horizon,
  type ScenarioKey,
} from './components/Projections'
import { FibZones } from './components/FibZones'
import {
  useEthPrice,
  useMarketChart,
  useFibMarketData,
} from './hooks/useEthData'
import { buildChartSeries } from './lib/analytics'

const SCENARIO_PCT: Record<Exclude<ScenarioKey, 'custom'>, number> = {
  bull: 40,
  base: 15,
  bear: -20,
}

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
  const [scenario, setScenario] = useState<ScenarioKey>('base')
  const [customPct, setCustomPct] = useState(10)
  const [horizon, setHorizon] = useState<Horizon>(90)

  const projectionPct =
    scenario === 'custom' ? customPct : SCENARIO_PCT[scenario]

  const series = buildChartSeries(points, {
    showOls,
    showMa,
    projectionPct,
    horizonDays: horizon,
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
        <Projections
          spot={price?.usd ?? null}
          scenario={scenario}
          customPct={customPct}
          horizon={horizon}
          onScenario={setScenario}
          onCustomPct={setCustomPct}
          onHorizon={setHorizon}
        />
      </main>
      <footer className="border-t border-line px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-xs tracking-[0.28em] text-glow uppercase">
            Aether
          </p>
          <p className="max-w-xl text-xs leading-relaxed text-mist">
            Market data from CoinGecko. Charts, Fibonacci levels, and scenarios
            are transparent analytics — not financial advice, trading signals,
            or AI price predictions.
          </p>
        </div>
      </footer>
    </div>
  )
}
