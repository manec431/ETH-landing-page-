import { projectPrice } from '../lib/analytics'
import { formatUsd } from '../lib/coingecko'

export type Horizon = 30 | 90 | 365
export type ScenarioKey = 'bull' | 'base' | 'bear' | 'custom'

const SCENARIOS: {
  key: ScenarioKey
  label: string
  pct: number
  blurb: string
}[] = [
  { key: 'bull', label: 'Bull', pct: 40, blurb: '+40% from spot' },
  { key: 'base', label: 'Base', pct: 15, blurb: '+15% from spot' },
  { key: 'bear', label: 'Bear', pct: -20, blurb: '−20% from spot' },
  { key: 'custom', label: 'Custom', pct: 0, blurb: 'Your own %' },
]

const HORIZONS: { days: Horizon; label: string }[] = [
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
  { days: 365, label: '1 year' },
]

type Props = {
  spot: number | null
  scenario: ScenarioKey
  customPct: number
  horizon: Horizon
  onScenario: (s: ScenarioKey) => void
  onCustomPct: (n: number) => void
  onHorizon: (h: Horizon) => void
}

export function Projections({
  spot,
  scenario,
  customPct,
  horizon,
  onScenario,
  onCustomPct,
  onHorizon,
}: Props) {
  const activePct =
    scenario === 'custom'
      ? customPct
      : (SCENARIOS.find((s) => s.key === scenario)?.pct ?? 0)

  const projected = spot != null ? projectPrice(spot, activePct) : null

  return (
    <section
      id="projections"
      className="relative scroll-mt-8 px-5 py-16 sm:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <p className="font-display text-xs tracking-[0.28em] text-danger uppercase">
          Scenarios
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-wide text-white sm:text-3xl">
          Price projection
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-mist">
          Apply fixed percentage moves to the current spot. Overlay the active
          scenario on the chart above. These are what-if illustrations — not
          model output or advice.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div>
              <p className="font-display text-[10px] tracking-[0.22em] text-mist uppercase">
                Scenario
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SCENARIOS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => onScenario(s.key)}
                    className={`px-4 py-2 font-display text-[10px] tracking-[0.16em] uppercase transition ${
                      scenario === s.key
                        ? 'bg-violet/20 text-white ring-1 ring-violet'
                        : 'border border-line text-mist hover:text-white'
                    }`}
                  >
                    {s.label}
                    {s.key !== 'custom'
                      ? ` ${s.pct > 0 ? '+' : ''}${s.pct}%`
                      : ''}
                  </button>
                ))}
              </div>
            </div>

            {scenario === 'custom' && (
              <div>
                <div className="flex items-center justify-between text-sm">
                  <label
                    htmlFor="custom-pct"
                    className="font-display text-[10px] tracking-[0.22em] text-mist uppercase"
                  >
                    Custom change
                  </label>
                  <span className="font-display text-glow">
                    {customPct > 0 ? '+' : ''}
                    {customPct}%
                  </span>
                </div>
                <input
                  id="custom-pct"
                  type="range"
                  min={-80}
                  max={150}
                  step={1}
                  value={customPct}
                  onChange={(e) => onCustomPct(Number(e.target.value))}
                  className="mt-3 w-full accent-glow"
                />
              </div>
            )}

            <div>
              <p className="font-display text-[10px] tracking-[0.22em] text-mist uppercase">
                Horizon
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {HORIZONS.map((h) => (
                  <button
                    key={h.days}
                    type="button"
                    onClick={() => onHorizon(h.days)}
                    className={`px-4 py-2 font-display text-[10px] tracking-[0.16em] uppercase transition ${
                      horizon === h.days
                        ? 'bg-glow/15 text-glow ring-1 ring-glow/50'
                        : 'border border-line text-mist hover:text-white'
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border border-line bg-ink/80 p-6">
            <p className="font-display text-[10px] tracking-[0.22em] text-mist uppercase">
              Illustrated outcome
            </p>
            <p className="mt-4 font-display text-3xl font-semibold text-white sm:text-4xl">
              {projected != null ? formatUsd(projected) : '—'}
            </p>
            <p className="mt-2 text-sm text-mist">
              {spot != null
                ? `From ${formatUsd(spot)} at ${activePct > 0 ? '+' : ''}${activePct}% over ${
                    HORIZONS.find((h) => h.days === horizon)?.label ?? horizon
                  }`
                : 'Waiting for live spot…'}
            </p>
            <div className="mt-6 space-y-2 border-t border-line pt-4 text-sm text-mist">
              {SCENARIOS.filter((s) => s.key !== 'custom').map((s) => {
                const p = spot != null ? projectPrice(spot, s.pct) : null
                return (
                  <div key={s.key} className="flex justify-between gap-4">
                    <span>
                      {s.label}{' '}
                      <span className="text-mist/60">({s.blurb})</span>
                    </span>
                    <span className="font-display text-white">
                      {p != null ? formatUsd(p) : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <aside className="mt-10 border border-danger/35 bg-danger/8 px-5 py-4 text-sm leading-relaxed text-[#ffc4cf]">
          <strong className="font-semibold text-danger">Disclaimer:</strong>{' '}
          Illustrative projections only. Cryptocurrency prices are highly
          volatile and past performance is not indicative of future results.
        </aside>
      </div>
    </section>
  )
}
