import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { SeriesPoint } from '../lib/analytics'
import { formatUsd } from '../lib/coingecko'

export type RangeDays = 7 | 30 | 90

type Props = {
  series: SeriesPoint[]
  days: RangeDays
  onDaysChange: (d: RangeDays) => void
  loading: boolean
  error: string | null
  showOls: boolean
  showMa: boolean
  onToggleOls: () => void
  onToggleMa: () => void
}

const RANGES: RangeDays[] = [7, 30, 90]

function formatAxisDate(ts: number, days: number) {
  const d = new Date(ts)
  if (days <= 7) {
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function PriceChart({
  series,
  days,
  onDaysChange,
  loading,
  error,
  showOls,
  showMa,
  onToggleOls,
  onToggleMa,
}: Props) {
  return (
    <section id="chart" className="relative scroll-mt-8 px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display text-xs tracking-[0.28em] text-violet uppercase">
              History
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-wide text-white sm:text-3xl">
              Price chart
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onDaysChange(r)}
                className={`px-3 py-1.5 font-display text-[10px] tracking-[0.18em] uppercase transition ${
                  days === r
                    ? 'bg-glow/15 text-glow ring-1 ring-glow/50'
                    : 'border border-line text-mist hover:text-white'
                }`}
              >
                {r}d
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-mist">
            <input
              type="checkbox"
              checked={showOls}
              onChange={onToggleOls}
              className="accent-violet"
            />
            OLS trend line
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-mist">
            <input
              type="checkbox"
              checked={showMa}
              onChange={onToggleMa}
              className="accent-glow"
            />
            Moving averages (7 / 25)
          </label>
        </div>

        <div className="mt-6 h-[340px] w-full border border-line/70 bg-panel/50 sm:h-[420px]">
          {loading ? (
            <div className="skeleton h-full w-full" />
          ) : error ? (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm text-danger">
              {error}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={series}
                margin={{ top: 16, right: 12, left: 0, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c5cff" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#7c5cff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1a2440" strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(v) => formatAxisDate(Number(v), days)}
                  stroke="#8b9bc4"
                  tick={{ fill: '#8b9bc4', fontSize: 11 }}
                  minTickGap={40}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tickFormatter={(v) =>
                    formatUsd(Number(v), Number(v) >= 1000)
                  }
                  stroke="#8b9bc4"
                  tick={{ fill: '#8b9bc4', fontSize: 11 }}
                  width={72}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0c1224',
                    border: '1px solid #1a2440',
                    borderRadius: 0,
                    color: '#e8eefc',
                  }}
                  labelFormatter={(label) =>
                    new Date(Number(label)).toLocaleString()
                  }
                  formatter={(value, name) => {
                    if (value == null || typeof value !== 'number') {
                      return ['—', String(name)]
                    }
                    return [formatUsd(value), String(name)]
                  }}
                />
                <Legend
                  wrapperStyle={{ color: '#8b9bc4', fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  name="ETH"
                  stroke="#3de0ff"
                  fill="url(#priceFill)"
                  strokeWidth={2}
                  connectNulls={false}
                  dot={false}
                  isAnimationActive={false}
                />
                {showMa && (
                  <Line
                    type="monotone"
                    dataKey="ma7"
                    name="MA 7"
                    stroke="#4dffb5"
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                )}
                {showMa && (
                  <Line
                    type="monotone"
                    dataKey="ma25"
                    name="MA 25"
                    stroke="#ffb84d"
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                )}
                {showOls && (
                  <Line
                    type="monotone"
                    dataKey="ols"
                    name="OLS trend"
                    stroke="#7c5cff"
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="projection"
                  name="Scenario"
                  stroke="#ff5c7a"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
        <p className="mt-3 text-xs text-mist/70">
          OLS and moving averages are descriptive analytics on historical prices —
          not forecasts or AI predictions.
        </p>
      </div>
    </section>
  )
}
