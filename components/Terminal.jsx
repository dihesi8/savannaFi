'use client';
import { useEffect, useRef, useState } from 'react';
import ZFade from './ZFade';
import CountUp from './CountUp';
import PriceChart from './PriceChart';
import SceneFrame from './SceneFrame';
import { useLiveData } from './LiveProvider';
import { CHAIN, RESERVE_XAU, SVN, GRAMS_PER_OZ } from '@/lib/config';
import { usd, num, ratio } from '@/lib/format';

const OZ_PER_KG = 1000 / GRAMS_PER_OZ;

function ago(iso, now) {
  if (!iso) return 'waiting';
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  return `${Math.round(s / 60)}m ago`;
}

export default function Terminal() {
  const { gold, chain, svn, samples } = useLiveData();
  const [now, setNow] = useState(Date.now());
  const pulse = useRef(0);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const price = gold.data?.price ?? null;
  const first = samples[0]?.p;
  const change = price && first ? ((price - first) / first) * 100 : null;
  pulse.current = samples.length;

  const svnUsd = svn.data?.priceUsd ?? null;
  const target = SVN.targetXauPerSvn;
  const rt = svnUsd && price ? svnUsd / price : null;
  let state = 'Awaiting contract address';
  if (rt != null) {
    const dev = rt / target - 1;
    state = Math.abs(dev) < 0.0005 ? 'On target' : dev > 0 ? 'Above target' : 'Below target';
  } else if (SVN.contractAddress) state = 'Waiting for pool data';

  const live = !!price && !gold.error;
  const chainLive = !!chain.data && !chain.error;

  return (
    <section className="section" id="terminal">
      <div className="container">
        <ZFade className="section-head">
          <h2>The live protocol terminal.</h2>
        </ZFade>

        <ZFade>
          <div className="terminal">
            <div className="term-bar">
              <span>SavannaFi Terminal</span>
              <span className="status">
                <span className={`dot ${live ? '' : 'off'}`} />
                {live ? `Live, updated ${ago(gold.data?.updatedAt, now)}` : gold.error ? 'Reconnecting' : 'Connecting'}
                {gold.data?.source ? ` via ${gold.data.source}` : ''}
              </span>
            </div>

            <div className="metrics">
              <div className="metric">
                <span className="metric-label">Gold, XAU per USD</span>
                <div className="metric-value">{price ? <CountUp value={price} format={(v) => usd(v)} /> : <span className="pending">Fetching</span>}</div>
                <span className={`metric-note ${change > 0 ? 'up' : ''}`}>{change != null ? `${change >= 0 ? '+' : ''}${change.toFixed(3)}% this session` : 'Per troy ounce'}</span>
              </div>
              <div className="metric">
                <span className="metric-label">SVN price</span>
                <div className="metric-value">{svnUsd ? <CountUp value={svnUsd} format={(v) => usd(v, v < 1 ? 6 : 2)} /> : <span className="pending">Awaiting CA</span>}</div>
                <span className="metric-note">{svnUsd ? 'From the main SVN pool' : 'Goes live when the contract address is set'}</span>
              </div>
              <div className="metric">
                <span className="metric-label">SVN to XAU ratio</span>
                <div className="metric-value">{rt != null ? <CountUp value={rt} format={(v) => ratio(v)} /> : <span className="pending">{target.toFixed(4)} target</span>}</div>
                <span className="metric-note">{state}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Gold reserve</span>
                <div className="metric-value">{RESERVE_XAU ? <CountUp value={RESERVE_XAU} format={(v) => `${num(v, 2)} oz`} /> : <span className="pending">Not published</span>}</div>
                <span className="metric-note">{RESERVE_XAU && price ? `Worth ${usd(RESERVE_XAU * price, 0)}` : 'Shown once a reserve is verified'}</span>
              </div>
            </div>

            <div className="term-body">
              <div className="term-chart">
                <div className="term-head"><strong>XAU/USD live stream</strong><span>{samples.length} samples this session</span></div>
                <PriceChart samples={samples} />
              </div>
              <div className="vault">
                <span className="vault-label">Gold bar valuation</span>
                <SceneFrame kind="vault" className="vault-scene" pulse={pulse.current} />
              </div>
            </div>

            <div className="bars">
              <div className="bar-cell"><span>1 gram</span><strong>{price ? usd(price / GRAMS_PER_OZ) : 'Fetching'}</strong></div>
              <div className="bar-cell"><span>1 troy ounce coin</span><strong>{price ? usd(price) : 'Fetching'}</strong></div>
              <div className="bar-cell"><span>1 kilo bar</span><strong>{price ? usd(price * OZ_PER_KG, 0) : 'Fetching'}</strong></div>
              <div className="bar-cell"><span>400 oz good delivery bar</span><strong>{price ? usd(price * 400, 0) : 'Fetching'}</strong></div>
            </div>

            <div className="chain-panel">
              <div className="chain-id">
                <div>
                  <span className="status" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--ivory-dim)', marginBottom: 14 }}>
                    <span className={`dot ${chainLive ? '' : 'off'}`} />{chainLive ? 'Network online' : chain.error ? 'Reconnecting' : 'Connecting'}
                  </span>
                  <h3>{CHAIN.name}</h3>
                </div>
                <div className="chain-links">
                  <a href={CHAIN.explorer} target="_blank" rel="noreferrer">Explorer</a>
                  <a href={CHAIN.docs} target="_blank" rel="noreferrer">Docs</a>
                </div>
              </div>
              <div className="chain-stats">
                <div className="chain-stat"><span>Chain ID</span><strong className="num">{CHAIN.id} ({CHAIN.hexId})</strong></div>
                <div className="chain-stat"><span>Latest block</span><strong>{chain.data?.block ? <CountUp value={chain.data.block} format={(v) => num(v)} /> : 'Fetching'}</strong></div>
                <div className="chain-stat"><span>Gas price</span><strong>{chain.data?.gasGwei != null ? <CountUp value={chain.data.gasGwei} format={(v) => `${v.toFixed(v < 1 ? 4 : 2)} gwei`} /> : 'Fetching'}</strong></div>
                <div className="chain-stat"><span>Stack</span><strong>{CHAIN.stack}</strong></div>
                <div className="chain-stat"><span>Gas token</span><strong>{CHAIN.gasToken}</strong></div>
                <div className="chain-stat"><span>RPC latency</span><strong>{chain.data?.latencyMs != null ? `${chain.data.latencyMs} ms` : 'Fetching'}</strong></div>
              </div>
            </div>
          </div>
        </ZFade>
      </div>
    </section>
  );
}
