import { NextResponse } from 'next/server';
import { RPC_URL } from '@/lib/serverRpc';

export const dynamic = 'force-dynamic';

// Read-only JSON-RPC proxy so the browser never calls the chain RPC directly (no CORS, no key leaks).
// Wallet actions go through the user's wallet, not through here.
const ALLOW = new Set([
  'eth_call', 'eth_chainId', 'eth_blockNumber', 'eth_getBalance', 'eth_getCode', 'eth_gasPrice',
  'eth_getTransactionReceipt', 'eth_getTransactionByHash', 'eth_getBlockByNumber', 'net_version',
]);

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Bad JSON' }, { status: 400 }); }
  const items = Array.isArray(body) ? body : [body];
  if (items.length > 10 || !items.every((i) => i && ALLOW.has(i.method))) {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 403 });
  }
  try {
    const r = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    return new NextResponse(await r.text(), { status: r.status, headers: { 'content-type': 'application/json' } });
  } catch {
    return NextResponse.json({ error: 'RPC unavailable' }, { status: 502 });
  }
}
