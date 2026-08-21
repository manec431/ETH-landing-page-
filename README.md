# Aether — Ethereum Price Tracker

Dark crypto landing page for live **$ETH** price, interactive charts, Fibonacci zones, and a paper trading bot.

**Live:** https://manec431.github.io/ETH-landing-page-/

## Features

- Live ETH/USD from CoinGecko (auto-refresh every 45s), plus 24h change, market cap, and volume
- Recharts price chart for 7 / 30 / 90 day ranges
- Optional OLS trend line and 7 / 25-period moving averages
- Fibonacci retracement / extension map for daily → yearly buy & sell zones, with volume buy/sell pressure
- Paper trading simulation: $1,000 start (as of today), daily Fib buy/sell bot, continuous balance, 8:00 PM local P&L ledger (browser localStorage)
- Mobile-responsive dark UI

Fib zones and the bot are illustrative simulations only — not AI predictions or financial advice. News/sentiment is not included (CoinGecko free API has no news feed).

## Local development

```bash
npm install
npm run dev
```

```bash
npm run build
npm run preview
```

For a GitHub Pages-style base path locally:

```bash
VITE_BASE_PATH=/ETH-landing-page-/ npm run build
```

## GitHub Pages

This repo deploys via GitHub Actions (`.github/workflows/deploy-pages.yml`) on every push to `main`.

1. Open **Settings → Pages**
2. Set **Source** to **GitHub Actions** (if not already)
3. After the workflow succeeds, the site is at:
   https://manec431.github.io/ETH-landing-page-/

Build uses `VITE_BASE_PATH=/${{ github.event.repository.name }}/` so assets resolve under the project Pages path.
