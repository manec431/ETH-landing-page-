export function Hero() {
  return (
    <header className="relative min-h-[100svh] overflow-hidden">
      {/* Full-bleed ethereal field */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 70% 20%, rgba(124,92,255,0.35), transparent 55%), radial-gradient(ellipse 70% 50% at 15% 80%, rgba(61,224,255,0.22), transparent 50%), radial-gradient(ellipse 50% 40% at 50% 50%, rgba(7,11,22,0.2), transparent), linear-gradient(165deg, #03050a 0%, #070b16 40%, #0a1020 100%)',
        }}
      />
      <div
        aria-hidden
        className="animate-pulse-glow pointer-events-none absolute -right-24 top-10 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.4),transparent_70%)] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 bottom-0 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(61,224,255,0.28),transparent_70%)] blur-2xl"
      />
      {/* Subtle grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(61,224,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(124,92,255,0.3) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage:
            'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)',
        }}
      />

      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <a
          href="#top"
          className="font-display text-sm font-semibold tracking-[0.28em] text-glow uppercase"
        >
          Aether
        </a>
        <div className="flex items-center gap-5 text-sm text-mist">
          <a href="#markets" className="transition hover:text-white">
            Markets
          </a>
          <a href="#chart" className="transition hover:text-white">
            Chart
          </a>
          <a href="#fibonacci" className="transition hover:text-white">
            Fibonacci
          </a>
          <a href="#simulation" className="transition hover:text-white">
            Sim
          </a>
        </div>
      </nav>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col justify-center px-5 pb-24 pt-16 sm:px-8 sm:pt-24">
        <p className="animate-rise font-display text-5xl font-bold tracking-[0.18em] text-white uppercase sm:text-7xl md:text-8xl">
          Aether
        </p>
        <h1 className="animate-rise-delay-1 mt-6 max-w-xl font-display text-xl font-medium tracking-wide text-glow sm:text-2xl">
          Live Ethereum, clear signals
        </h1>
        <p className="animate-rise-delay-2 mt-4 max-w-md text-base leading-relaxed text-mist sm:text-lg">
          Track $ETH in real time with transparent charts and Fib structure —
          not black-box predictions.
        </p>
        <div className="animate-rise-delay-2 mt-10 flex flex-wrap gap-3">
          <a
            href="#markets"
            className="inline-flex items-center justify-center bg-gradient-to-r from-violet to-glow px-6 py-3 font-display text-xs font-semibold tracking-[0.2em] text-void uppercase transition hover:brightness-110"
          >
            View live price
          </a>
          <a
            href="#simulation"
            className="inline-flex items-center justify-center border border-line bg-panel/40 px-6 py-3 font-display text-xs font-semibold tracking-[0.2em] text-white uppercase backdrop-blur transition hover:border-glow/50"
          >
            Paper trading bot
          </a>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-void to-transparent"
      />
    </header>
  )
}
