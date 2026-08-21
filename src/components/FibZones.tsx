import { useState } from 'react'
import { formatPct, formatUsd } from '../lib/coingecko'
import {
  analyzeAllTimeframes,
  type TimeframeKey,
  type TimeframeZones,
} from '../lib/fibonacci'
import type { ChartPoint } from '../lib/coingecko'

type Props = {
  shortPoints: ChartPoint[]
  longPoints: ChartPoint[]
  spot: number | null
  loading: boolean
  error: string | null
}

function trendLabel(t: TimeframeZones['trend']) {
  if (t === 'up') return 'Uptrend'
  if (t === 'down') return 'Downtrend'
  return 'Sideways'
}

function pressureLabel(z: TimeframeZones) {
  const buy = Math.round(z.pressure.buyShare * 100)
  const sell = Math.round(z.pressure.sellShare * 100)
  if (z.pressure.net === 'buy') return `Buy pressure ${buy}% / ${sell}%`
  if (z.pressure.net === 'sell') return `Sell pressure ${sell}% / buy ${buy}%`
  return `Balanced ${buy}% buy / ${sell}% sell`
}

export function FibZones({
  shortPoints,
  longPoints,
  spot,
  loading,
  error,
}: Props) {
  const [active, setActive] = useState<TimeframeKey>('monthly')

  const zones =
    shortPoints.length + longPoints.length > 0
      ? analyzeAllTimeframes(shortPoints, longPoints, spot ?? undefined)
      : []

  const selected = zones.find((z) => z.key === active) ?? zones[0]

  return (
    <section id="fibonacci" className="relative scroll-mt-8 px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="font-display text-xs tracking-[0.28em] text-violet uppercase">
          Fibonacci map
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-wide text-white sm:text-3xl">
          Multi-timeframe zones
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-mist">
          Swing high/low Fibonacci retracements and extensions, with volume
          tagged by price direction (buy vs sell pressure). These are geometric
          levels from market structure — not AI forecasts, signals, or advice.
        </p>

        {error && (
          <p className="mt-6 border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-2">
          {zones.map((z) => (
            <button
              key={z.key}
              type="button"
              onClick={() => setActive(z.key)}
              className={`px-4 py-2 font-display text-[10px] tracking-[0.16em] uppercase transition ${
                selected?.key === z.key
                  ? 'bg-violet/20 text-white ring-1 ring-violet'
                  : 'border border-line text-mist hover:text-white'
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>

        {loading && !selected ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="skeleton h-48" />
            <div className="skeleton h-48" />
          </div>
        ) : selected ? (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="font-display text-[10px] tracking-[0.22em] text-mist uppercase">
                    {selected.label} structure · {selected.lookbackDays}d lookback
                  </p>
                  <p className="mt-2 text-sm text-mist">
                    {trendLabel(selected.trend)} · range{' '}
                    <span className="text-white">
                      {formatPct(selected.rangeChangePct)}
                    </span>
                  </p>
                </div>
                <p className="text-sm text-mist">
                  {pressureLabel(selected)}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="border border-signal/30 bg-signal/5 p-5">
                  <p className="font-display text-[10px] tracking-[0.22em] text-signal uppercase">
                    Buy zone (support)
                  </p>
                  <p className="mt-3 font-display text-xl font-semibold text-white sm:text-2xl">
                    {formatUsd(selected.buyZone.low)} –{' '}
                    {formatUsd(selected.buyZone.high)}
                  </p>
                  <p className="mt-2 text-xs text-mist">
                    Fib 61.8%–78.6% retracement cluster toward swing low
                  </p>
                </div>
                <div className="border border-danger/30 bg-danger/5 p-5">
                  <p className="font-display text-[10px] tracking-[0.22em] text-danger uppercase">
                    Sell zone (resistance)
                  </p>
                  <p className="mt-3 font-display text-xl font-semibold text-white sm:text-2xl">
                    {formatUsd(selected.sellZone.low)} –{' '}
                    {formatUsd(selected.sellZone.high)}
                  </p>
                  <p className="mt-2 text-xs text-mist">
                    Swing high through 1.272–1.618 extension cluster
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border border-line bg-ink/60 p-5 sm:grid-cols-4">
                <div>
                  <p className="font-display text-[10px] tracking-[0.18em] text-mist uppercase">
                    Illust. high
                  </p>
                  <p className="mt-2 font-display text-lg text-white">
                    {formatUsd(selected.projectedHigh)}
                  </p>
                </div>
                <div>
                  <p className="font-display text-[10px] tracking-[0.18em] text-mist uppercase">
                    Illust. low
                  </p>
                  <p className="mt-2 font-display text-lg text-white">
                    {formatUsd(selected.projectedLow)}
                  </p>
                </div>
                <div>
                  <p className="font-display text-[10px] tracking-[0.18em] text-mist uppercase">
                    Swing high
                  </p>
                  <p className="mt-2 font-display text-lg text-white">
                    {formatUsd(selected.swingHigh)}
                  </p>
                </div>
                <div>
                  <p className="font-display text-[10px] tracking-[0.18em] text-mist uppercase">
                    Swing low
                  </p>
                  <p className="mt-2 font-display text-lg text-white">
                    {formatUsd(selected.swingLow)}
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-line bg-panel/40 p-5">
              <p className="font-display text-[10px] tracking-[0.22em] text-mist uppercase">
                Fibonacci levels
              </p>
              <ul className="mt-4 max-h-[360px] space-y-2 overflow-y-auto text-sm">
                {selected.levels.map((lvl) => {
                  const nearSpot =
                    spot != null &&
                    Math.abs(lvl.price - spot) / spot < 0.02
                  return (
                    <li
                      key={`${lvl.kind}-${lvl.ratio}`}
                      className={`flex items-center justify-between gap-3 border-b border-line/60 py-2 ${
                        nearSpot ? 'text-glow' : 'text-mist'
                      }`}
                    >
                      <span>
                        <span className="font-display text-[10px] tracking-wider uppercase text-white/80">
                          {lvl.kind === 'extension' ? 'Ext' : 'Ret'} {lvl.label}
                        </span>
                      </span>
                      <span className="font-display text-white">
                        {formatUsd(lvl.price)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        ) : (
          <p className="mt-8 text-sm text-mist">No timeframe data yet.</p>
        )}

        {/* Summary table */}
        {zones.length > 0 && (
          <div className="mt-10 overflow-x-auto border border-line">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-ink/80 font-display text-[10px] tracking-[0.18em] text-mist uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Timeframe</th>
                  <th className="px-4 py-3 font-medium">Trend</th>
                  <th className="px-4 py-3 font-medium">Buy zone</th>
                  <th className="px-4 py-3 font-medium">Sell zone</th>
                  <th className="px-4 py-3 font-medium">Illust. high</th>
                  <th className="px-4 py-3 font-medium">Illust. low</th>
                  <th className="px-4 py-3 font-medium">Pressure</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => (
                  <tr
                    key={z.key}
                    className="border-t border-line/80 text-mist hover:bg-panel/40"
                  >
                    <td className="px-4 py-3 font-display text-white">
                      {z.label}
                    </td>
                    <td className="px-4 py-3">{trendLabel(z.trend)}</td>
                    <td className="px-4 py-3 text-signal">
                      {formatUsd(z.buyZone.low)}–{formatUsd(z.buyZone.high)}
                    </td>
                    <td className="px-4 py-3 text-danger">
                      {formatUsd(z.sellZone.low)}–{formatUsd(z.sellZone.high)}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {formatUsd(z.projectedHigh)}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {formatUsd(z.projectedLow)}
                    </td>
                    <td className="px-4 py-3">
                      {Math.round(z.pressure.buyShare * 100)}% buy
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <aside className="mt-8 space-y-3 border border-line/80 bg-ink/50 px-5 py-4 text-sm leading-relaxed text-mist">
          <p>
            <strong className="font-semibold text-white">Method:</strong>{' '}
            {selected?.method ??
              'Fibonacci retracements & extensions from swing high/low.'}
          </p>
          <p>
            <strong className="font-semibold text-white">News:</strong> The free
            CoinGecko API used here does not include a news/sentiment feed.
            Zones are derived only from price structure and volume direction —
            not headlines.
          </p>
          <p className="text-[#ffc4cf]">
            <strong className="font-semibold text-danger">Disclaimer:</strong>{' '}
            Illustrative technical levels only. Cryptocurrency prices are highly
            volatile and past performance is not indicative of future results.
            Not financial advice.
          </p>
        </aside>
      </div>
    </section>
  )
}
