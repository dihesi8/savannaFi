'use client';
import Link from 'next/link';
import ZFade from './ZFade';
import Tilt from './Tilt';
import CountUp from './CountUp';
import Spark from './Spark';
import PoolBadge from './PoolBadge';
import { Arrow } from './Art';
import { useLiveData } from './LiveProvider';
import { useStaking } from './StakingProvider';
import { POOLS } from '@/lib/pools';
import { usd, num } from '@/lib/format';

const POINTS = [
  ['Pick a stock', 'Each pool is tied to one tokenized stock on Robinhood Chain.'],
  ['Stake SVN', 'Your SVN supports that stock\u2019s liquidity while it is staked.'],
  ['Unstake any time', 'Your tokens stay yours. Withdraw them whenever you like.'],
];

function Mini({ pool, index }) {
  const { stocks } = useLiveData();
  const s = useStaking();
  const q = stocks.data?.quotes?.[pool.symbol];
  const up = (q?.changePct ?? 0) >= 0;
  return (
    <Tilt max={6}>
      <Link href="/app" className="mini-pool">
        <div className="cell-pool"><PoolBadge symbol={pool.symbol} /><div><strong>{pool.name}</strong><small>{pool.symbol}</small></div></div>
        <div className="mini-mid">
          <div>
            <strong>{q ? <CountUp value={q.price} format={(v) => usd(v)} duration={1.6} /> : <span className="pending">Loading</span>}</strong>
            {q && <small className={up ? 'up' : ''}>{up ? '+' : ''}{q.changePct.toFixed(2)}% today</small>}
          </div>
          <Spark data={q?.spark} up={up} />
        </div>
        <div className="mini-foot">
          <span>{s.ready ? `${num(s.asNumber(s.overview.totals[index]), 0)} ${s.token.symbol} staked` : 'Stake SVN'}</span>
          <b>Open pool</b>
        </div>
      </Link>
    </Tilt>
  );
}

export default function Farms() {
  return (
    <section className="section" id="farms">
      <div className="container">
        <ZFade className="section-head">
          <h2>Stake SVN behind your favorite stocks.</h2>
          <p>
            Pick a stock pool, stake SVN, and help deepen that stock&apos;s liquidity on Robinhood Chain.
            Stake and unstake whenever you like.
          </p>
        </ZFade>

        <ZFade>
          <ol className="steps steps-3">
            {POINTS.map(([t, d], i) => (
              <li key={t}><b className="num">{i + 1}</b><h3>{t}</h3><p>{d}</p></li>
            ))}
          </ol>
        </ZFade>

        <div className="mini-grid stage-3d">
          {POOLS.slice(0, 4).map((p, i) => (
            <ZFade key={p.id} depth={360}><Mini pool={p} index={i} /></ZFade>
          ))}
        </div>

        <ZFade>
          <div className="farms-cta">
            <Link className="btn btn-gold" href="/app">Open the farms <Arrow /></Link>
            <p className="vault-note">Stock prices are live and can be delayed. Smart contracts carry risk, so only stake what you are comfortable with.</p>
          </div>
        </ZFade>
      </div>
    </section>
  );
}
