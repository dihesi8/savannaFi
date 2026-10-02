import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const RPC = process.env.RH_RPC_URL || 'https://rpc.mainnet.chain.robinhood.com';
let cache = { at: 0, body: null };
const TTL = 4000;

export async function GET() {
  if (cache.body && Date.now() - cache.at < TTL) return NextResponse.json(cache.body);
  try {
    const t0 = Date.now();
    const r = await fetch(RPC, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify([
        { jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] },
        { jsonrpc: '2.0', id: 2, method: 'eth_gasPrice', params: [] },
        { jsonrpc: '2.0', id: 3, method: 'eth_chainId', params: [] },
      ]),
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });
    if (!r.ok) throw new Error(`rpc ${r.status}`);
    const arr = await r.json();
    const by = Object.fromEntries(arr.map((x) => [x.id, x.result]));
    const body = {
      block: parseInt(by[1], 16),
      gasGwei: Number(BigInt(by[2])) / 1e9,
      chainId: parseInt(by[3], 16),
      latencyMs: Date.now() - t0,
      updatedAt: new Date().toISOString(),
    };
    cache = { at: Date.now(), body };
    return NextResponse.json(body);
  } catch {
    if (cache.body) return NextResponse.json({ ...cache.body, stale: true });
    return NextResponse.json({ error: 'Robinhood Chain RPC unavailable' }, { status: 502 });
  }
}
