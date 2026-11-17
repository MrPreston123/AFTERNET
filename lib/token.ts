'use client';
import { useEffect, useState } from 'react';
import { TOKEN } from './config';

export type TokenStatus = {
  live: boolean;
  ca: string | null;
  buy: string | null;
  chart: string | null;
  solscan?: string | null;
  price?: number | null;
  marketCap?: number | null;
  change24h?: number | null;
  volume24h?: number | null;
};

let shared: TokenStatus | null = null;
const subs = new Set<(s: TokenStatus) => void>();
let timer: ReturnType<typeof setTimeout> | null = null;

async function poll() {
  try {
    const r = await fetch(TOKEN.statusApi, { cache: 'no-store' });
    if (r.ok) {
      shared = await r.json();
      subs.forEach((f) => f(shared!));
    }
  } catch {}
  // Before launch: check every 15 s so the site flips the moment the coin exists. After: refresh the price every minute.
  if (subs.size) timer = setTimeout(poll, shared?.live ? 60000 : 15000);
}

/** Live $AFTERNET status. The CA stays hidden until the coin exists on-chain. */
export function useToken(): TokenStatus | null {
  const [s, setS] = useState<TokenStatus | null>(shared);
  useEffect(() => {
    subs.add(setS);
    if (!timer) poll();
    return () => {
      subs.delete(setS);
      if (!subs.size && timer) { clearTimeout(timer); timer = null; }
    };
  }, []);
  return s;
}

export const fmtUsd = (n: number) =>
  n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(1)}K` : `$${n.toFixed(0)}`;
export const fmtPrice = (n: number) => (n >= 1 ? `$${n.toFixed(2)}` : `$${n.toPrecision(3)}`);
