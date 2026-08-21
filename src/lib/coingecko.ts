export type EthPrice = {
  usd: number
  usd_24h_change: number
  usd_market_cap: number
  usd_24h_vol: number
}

export type ChartPoint = {
  timestamp: number
  price: number
}

const PRICE_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true'

export async function fetchEthPrice(): Promise<EthPrice> {
  const res = await fetch(PRICE_URL)
  if (!res.ok) {
    throw new Error(`Price fetch failed (${res.status})`)
  }
  const data = (await res.json()) as {
    ethereum: EthPrice
  }
  return data.ethereum
}

export async function fetchMarketChart(days: number): Promise<ChartPoint[]> {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=${days}`,
  )
  if (!res.ok) {
    throw new Error(`Chart fetch failed (${res.status})`)
  }
  const data = (await res.json()) as { prices: [number, number][] }
  return data.prices.map(([timestamp, price]) => ({ timestamp, price }))
}

export function formatUsd(value: number, compact = false): string {
  if (compact) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(value)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value)
}

export function formatPct(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}
