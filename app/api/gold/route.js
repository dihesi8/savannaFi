import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

let cache = { at: 0, body: null };
const TTL = 8000;

async function fromGoldApi() {
  const r = await fetch('https://api.gold-api.com/price/XAU', {
    signal: AbortSignal.timeout(5000),
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(`gold-api ${r.status}`);
  const j = await r.json();
  const price = Number(j.price);
  if (!Number.isFinite(price) || price <= 0) throw new Error('gold-api bad price');
  return { price, updatedAt: j.updatedAt || new Date().toISOString(), source: 'gold-api.com' };
}

// Fallback: free CDN-hosted currency feed, quoted as USD per 1 XAU.
async function fromCurrencyApi() {
  const r = await fetch(
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/xau.json',
    { signal: AbortSignal.timeout(5000), cache: 'no-store' }
  );
  if (!r.ok) throw new Error(`currency-api ${r.status}`);
  const j = await r.json();
  const price = Number(j?.xau?.usd);
  if (!Number.isFinite(price) || price <= 0) throw new Error('currency-api bad price');
  return { price, updatedAt: new Date().toISOString(), source: 'currency-api' };
}

export async function GET() {
  if (cache.body && Date.now() - cache.at < TTL) return NextResponse.json(cache.body);
  try {
    let body;
    try {
      body = await fromGoldApi();
    } catch {
      body = await fromCurrencyApi();
    }
    cache = { at: Date.now(), body };
    return NextResponse.json(body);
  } catch (e) {
    if (cache.body) return NextResponse.json({ ...cache.body, stale: true });
    return NextResponse.json({ error: 'Gold price unavailable' }, { status: 502 });
  }
}
