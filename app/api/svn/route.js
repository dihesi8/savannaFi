import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CA = process.env.NEXT_PUBLIC_SVN_CA || '';
let cache = { at: 0, body: null };
const TTL = 8000;

export async function GET() {
  if (!CA) return NextResponse.json({ pending: true });
  if (cache.body && Date.now() - cache.at < TTL) return NextResponse.json(cache.body);
  try {
    const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${CA}`, {
      signal: AbortSignal.timeout(6000),
      cache: 'no-store',
    });
    if (!r.ok) throw new Error(`dexscreener ${r.status}`);
    const j = await r.json();
    const pairs = (j.pairs || []).filter((p) => p.priceUsd);
    if (!pairs.length) return NextResponse.json({ pending: true, reason: 'no-pairs' });
    pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
    const p = pairs[0];
    const body = {
      priceUsd: Number(p.priceUsd),
      change24h: p.priceChange?.h24 ?? null,
      marketCap: p.marketCap ?? p.fdv ?? null,
      liquidityUsd: p.liquidity?.usd ?? null,
      volume24h: p.volume?.h24 ?? null,
      pairUrl: p.url,
      updatedAt: new Date().toISOString(),
    };
    cache = { at: Date.now(), body };
    return NextResponse.json(body);
  } catch {
    if (cache.body) return NextResponse.json({ ...cache.body, stale: true });
    return NextResponse.json({ error: 'SVN price unavailable' }, { status: 502 });
  }
}
