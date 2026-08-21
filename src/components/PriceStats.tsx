import { formatPct, formatUsd, type EthPrice } from '../lib/coingecko'

type Props = {
  price: EthPrice | null
  loading: boolean
  error: string | null
  updatedAt: Date | null
  onRefresh: () => void
}

function Stat({
  label,
  value,
  tone,
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
    <div className="border-t border-line/80 pt-4 sm:border-t-0 sm:border-l sm:border-line/80 sm:pt-0 sm:pl-6 first:border-t-0 first:sm:border-l-0 first:sm:pl-0">
      <p className="font-display text-[10px] tracking-[0.22em] text-mist uppercase">
        {label}
      </p>
      <p className={`mt-2 font-display text-xl font-semibold sm:text-2xl ${color}`}>
        {value}
      </p>
    </div>
  )
}

export function PriceStats({
  price,
  loading,
  error,
  updatedAt,
  onRefresh,
}: Props) {
  const changeTone =
    !price
      ? 'neutral'
      : price.usd_24h_change > 0
        ? 'up'
        : price.usd_24h_change < 0
          ? 'down'
          : 'neutral'

  return (
    <section id="markets" className="relative scroll-mt-8 px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display text-xs tracking-[0.28em] text-glow uppercase">
              Live market
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-wide text-white sm:text-3xl">
              Ethereum right now
            </h2>
          </div>
          <div className="flex items-center gap-3 text-sm text-mist">
            {updatedAt && (
              <span>
                Updated{' '}
                {updatedAt.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            )}
            <button
              type="button"
              onClick={onRefresh}
              className="border border-line px-3 py-1.5 font-display text-[10px] tracking-[0.18em] text-white uppercase transition hover:border-glow/60"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-6 border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error} — CoinGecko may be rate-limited; try again shortly.
          </p>
        )}

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {loading && !price ? (
            <>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-16 rounded-sm" />
              ))}
            </>
          ) : price ? (
            <>
              <Stat label="ETH / USD" value={formatUsd(price.usd)} />
              <Stat
                label="24h change"
                value={formatPct(price.usd_24h_change)}
                tone={changeTone}
              />
              <Stat
                label="Market cap"
                value={formatUsd(price.usd_market_cap, true)}
              />
              <Stat
                label="24h volume"
                value={formatUsd(price.usd_24h_vol, true)}
              />
            </>
          ) : null}
        </div>
        <p className="mt-6 text-xs text-mist/70">
          Auto-refreshes every 45 seconds via CoinGecko public API.
        </p>
      </div>
    </section>
  )
}
