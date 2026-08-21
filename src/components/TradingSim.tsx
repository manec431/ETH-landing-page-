import { formatPct, formatUsd } from '../lib/coingecko'
import {
  PN_L_HOUR,
  STARTING_BALANCE,
  type SimState,
} from '../lib/tradingSim'
import type { TimeframeZones } from '../lib/fibonacci'

type Props = {
  state: SimState | null
  spot: number | null
  markEquity: number | null
  dailyZones: TimeframeZones | null
  onReset: () => void
}

export function TradingSim({
  state,
  spot,
  markEquity,
  dailyZones,
  onReset,
}: Props) {
  const totalPnL =
    markEquity != null && state
      ? markEquity - state.startingBalance
      : null
  const totalPnLPct =
    totalPnL != null && state
      ? (totalPnL / state.startingBalance) * 100
      : null

  const latestSnap =
    state && state.dailySnapshots.length > 0
      ? state.dailySnapshots[state.dailySnapshots.length - 1]
      : null

  const awaitingEightPm =
    state != null &&
    new Date().getHours() < PN_L_HOUR &&
    state.lastSnapshotDateKey !==
      `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`

  return (
    <section id="simulation" className="relative scroll-mt-8 px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display text-xs tracking-[0.28em] text-glow uppercase">
              Paper bot
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-wide text-white sm:text-3xl">
              Trading simulation
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-mist">
              Automated daily paper trades from the Fibonacci daily buy/sell
              zones, starting at {formatUsd(STARTING_BALANCE)} as of today.
              Continuous mark-to-market balance plus an 8:00 PM local P&amp;L
              snapshot. Not real money — not advice.
            </p>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="border border-line px-4 py-2 font-display text-[10px] tracking-[0.18em] text-mist uppercase transition hover:border-danger/50 hover:text-white"
          >
            Reset sim
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Continuous balance"
            value={markEquity != null ? formatUsd(markEquity) : '—'}
            tone="neutral"
          />
          <Stat
            label="Total P&L"
            value={
              totalPnL != null && totalPnLPct != null
                ? `${formatUsd(totalPnL)} (${formatPct(totalPnLPct)})`
                : '—'
            }
            tone={
              totalPnL == null
                ? 'neutral'
                : totalPnL > 0
                  ? 'up'
                  : totalPnL < 0
                    ? 'down'
                    : 'neutral'
            }
          />
          <Stat
            label="Cash / ETH"
            value={
              state
                ? `${formatUsd(state.cash)} · ${(state.eth).toFixed(5)} ETH`
                : '—'
            }
          />
          <Stat
            label="8pm P&L (latest)"
            value={
              latestSnap
                ? `${formatUsd(latestSnap.dayPnL)} · ${formatUsd(latestSnap.equity)}`
                : awaitingEightPm
                  ? 'Awaiting 8:00 PM'
                  : 'No snapshot yet'
            }
            tone={
              latestSnap == null
                ? 'neutral'
                : latestSnap.dayPnL > 0
                  ? 'up'
                  : latestSnap.dayPnL < 0
                    ? 'down'
                    : 'neutral'
            }
          />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="border border-line bg-ink/60 p-5 text-sm text-mist">
            <p className="font-display text-[10px] tracking-[0.22em] text-mist uppercase">
              Bot rules (daily Fib)
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed">
              <li>
                <span className="text-signal">Buy</span> all cash → ETH when spot
                ≤ daily Fib buy-zone high
                {dailyZones
                  ? ` (${formatUsd(dailyZones.buyZone.low)}–${formatUsd(dailyZones.buyZone.high)})`
                  : ''}
              </li>
              <li>
                <span className="text-danger">Sell</span> all ETH → cash when spot
                ≥ daily Fib sell-zone low
                {dailyZones
                  ? ` (${formatUsd(dailyZones.sellZone.low)}–${formatUsd(dailyZones.sellZone.high)})`
                  : ''}
              </li>
              <li>At most one decision pass per local calendar day</li>
              <li>
                Equity snapshot once at/after {PN_L_HOUR}:00 local each day
              </li>
            </ul>
            {state && (
              <p className="mt-4 text-xs text-mist/70">
                Started {state.startDateKey} · spot{' '}
                {spot != null ? formatUsd(spot) : '—'} · last buy{' '}
                {state.lastBuyDateKey ?? 'none'} · last sell{' '}
                {state.lastSellDateKey ?? 'none'}
              </p>
            )}
          </div>

          <div className="border border-line bg-panel/40 p-5">
            <p className="font-display text-[10px] tracking-[0.22em] text-mist uppercase">
              8pm daily ledger
            </p>
            {state && state.dailySnapshots.length > 0 ? (
              <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm">
                {[...state.dailySnapshots].reverse().map((s) => (
                  <li
                    key={s.dateKey}
                    className="flex items-center justify-between gap-3 border-b border-line/60 py-2 text-mist"
                  >
                    <span className="font-display text-xs tracking-wider text-white">
                      {s.dateKey}
                    </span>
                    <span
                      className={
                        s.dayPnL > 0
                          ? 'text-signal'
                          : s.dayPnL < 0
                            ? 'text-danger'
                            : 'text-mist'
                      }
                    >
                      {formatUsd(s.dayPnL)} → {formatUsd(s.equity)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-mist">
                No 8pm snapshot yet. The first entry posts after 8:00 PM local
                on the start day (when this page is open or next visited).
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 border border-line">
          <div className="border-b border-line bg-ink/80 px-4 py-3 font-display text-[10px] tracking-[0.18em] text-mist uppercase">
            Trade log
          </div>
          {state && state.trades.length > 0 ? (
            <ul className="max-h-72 divide-y divide-line/80 overflow-y-auto text-sm">
              {[...state.trades].reverse().map((t) => (
                <li
                  key={t.id}
                  className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span
                      className={`font-display text-xs tracking-wider uppercase ${
                        t.side === 'buy' ? 'text-signal' : 'text-danger'
                      }`}
                    >
                      {t.side}
                    </span>
                    <span className="ml-2 text-mist">{t.dateKey}</span>
                    <p className="mt-1 text-xs text-mist/80">{t.reason}</p>
                  </div>
                  <div className="font-display text-white sm:text-right">
                    {formatUsd(t.usd)} @ {formatUsd(t.price)}
                    <div className="text-xs text-mist">
                      {t.eth.toFixed(5)} ETH
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-6 text-sm text-mist">
              No trades yet. The bot buys when live ETH enters the daily Fib buy
              zone, and sells in the sell zone — checked once per day.
            </p>
          )}
        </div>

        <aside className="mt-8 border border-danger/35 bg-danger/8 px-5 py-4 text-sm leading-relaxed text-[#ffc4cf]">
          <strong className="font-semibold text-danger">Disclaimer:</strong>{' '}
          Paper simulation only, stored in this browser. Cryptocurrency prices
          are highly volatile and past performance is not indicative of future
          results. Not financial advice.
        </aside>
      </div>
    </section>
  )
}

function Stat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: string
  tone?: 'up' | 'down' | 'neutral'
}) {
  const color =
    tone === 'up'
      ? 'text-signal'
      : tone === 'down'
        ? 'text-danger'
        : 'text-white'

  return (
    <div className="border border-line bg-ink/50 p-4">
      <p className="font-display text-[10px] tracking-[0.22em] text-mist uppercase">
        {label}
      </p>
      <p className={`mt-2 font-display text-lg font-semibold sm:text-xl ${color}`}>
        {value}
      </p>
    </div>
  )
}
