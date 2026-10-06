import { NextResponse } from 'next/server';
import { SYMBOLS } from '@/lib/pools';

export const dynamic = 'force-dynamic';

let cache = { at: 0, body: null };
const TTL = 20000;
const UA = { 'user-agent': 'Mozilla/5.0 (compatible; SavannaFi/1.0)' };

async function yahoo(symbol) {
  const r = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=5m`,
    { headers: UA, signal: AbortSignal.timeout(6000), cache: 'no-store' }
  );
  if (!r.ok) throw new Error(`yahoo ${r.status}`);
  const j = await r.json();
  const res = j?.chart?.result?.[0];
  const m = res?.meta;
  const price = Number(m?.regularMarketPrice);
  if (!Number.isFinite(price) || price <= 0) throw new Error('yahoo bad price');
  const prev = Number(m.chartPreviousClose ?? m.previousClose) || price;
  const closes = (res.indicators?.quote?.[0]?.close || []).filter((v) => v != null);
  const step = Math.max(1, Math.floor(closes.length / 40));
  const spark = closes.filter((_, i) => i % step === 0 || i === closes.length - 1);
  return {
    price,
    prevClose: prev,
    changePct: ((price - prev) / prev) * 100,
    time: m.regularMarketTime ? m.regularMarketTime * 1000 : Date.now(),
    spark,
  };
}

// Fallback: Stooq delivers a delayed quote for all symbols in one CSV.
async function stooq(symbols) {
  const s = symbols.map((x) => `${x.toLowerCase()}.us`).join('+');
  const r = await fetch(`https://stooq.com/q/l/?s=${s}&f=sd2t2ohlc&h&e=csv`, { headers: UA, signal: AbortSignal.timeout(6000), cache: 'no-store' });
  if (!r.ok) throw new Error(`stooq ${r.status}`);
  const rows = (await r.text()).trim().split('\n').slice(1);
  const out = {};
  for (const row of rows) {
    const [sym, date, time, open, , , close] = row.split(',');
    const price = Number(close);
    if (!Number.isFinite(price) || price <= 0) continue;
    const o = Number(open) || price;
    out[sym.replace('.US', '').toUpperCase()] = {
      price, prevClose: o, changePct: ((price - o) / o) * 100,
      time: Date.parse(`${date}T${time}Z`) || Date.now(), spark: [],
    };
  }
  return out;
}

export async function GET() {
  if (cache.body && Date.now() - cache.at < TTL) return NextResponse.json(cache.body);
  const quotes = {};
  let source = 'Yahoo Finance';
  const settled = await Promise.allSettled(SYMBOLS.map((s) => yahoo(s)));
  settled.forEach((r, i) => { if (r.status === 'fulfilled') quotes[SYMBOLS[i]] = r.value; });

  const missing = SYMBOLS.filter((s) => !quotes[s]);
  if (missing.length) {
    try {
      const fb = await stooq(missing);
      Object.assign(quotes, fb);
      if (Object.keys(fb).length) source = missing.length === SYMBOLS.length ? 'Stooq' : 'Yahoo Finance and Stooq';
    } catch {}
  }

  if (!Object.keys(quotes).length) {
    if (cache.body) return NextResponse.json({ ...cache.body, stale: true });
    return NextResponse.json({ error: 'Stock prices unavailable' }, { status: 502 });
  }
  const body = { quotes, source, updatedAt: new Date().toISOString() };
  cache = { at: Date.now(), body };
  return NextResponse.json(body);
}
