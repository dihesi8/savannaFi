'use client';
import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import ZFade from './ZFade';
import Tilt from './Tilt';
import CountUp from './CountUp';
import { useLiveData } from './LiveProvider';
import { RESERVE_XAU, TARGETS } from '@/lib/config';
import { usd, num } from '@/lib/format';

const EASE = [0.22, 0.8, 0.2, 1];

function Meter({ label, value, target }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const pct = value != null && target ? Math.min(1, value / target) : 0;
  return (
    <div className="meter" ref={ref}>
      <div className="meter-head">
        <span>{label}</span>
        <strong>
          {value != null ? <CountUp value={value} format={(v) => usd(v, 0)} /> : 'Awaiting contract'}
          <small>{target ? ` of ${usd(target, 0)}` : ' / target to be announced'}</small>
        </strong>
      </div>
      <div className="meter-track">
        <motion.div className="meter-fill" initial={{ scaleX: 0 }} animate={inView ? { scaleX: pct } : {}} transition={{ duration: 1.7, ease: EASE }} />
      </div>
    </div>
  );
}

const STEPS = [
  ['The vault holds XAU', 'Gold sits in the vault and is valued live against spot.'],
  ['A target is reached', 'Market cap or 24 hour volume crosses the published target.'],
  ['The vault splits', 'XAU is divided between liquidity support and holder rewards.'],
  ['Holders earn XAU', 'Rewards follow each wallet\u2019s share of eligible SVN.'],
];

function Calculator({ price }) {
  const [vault, setVault] = useState(RESERVE_XAU ?? 10);
  const [holderPct, setHolderPct] = useState(50);
  const [supplyPct, setSupplyPct] = useState(0.5);

  const pool = Math.max(0, vault) * (holderPct / 100);
  const yours = pool * (supplyPct / 100);
  const liquidity = Math.max(0, vault) - pool;

  return (
    <div className="calc">
      <div className="calc-inputs">
        <label className="field">
          <span>XAU in the vault (oz)</span>
          <input type="number" min="0" step="0.5" value={vault} onChange={(e) => setVault(Number(e.target.value) || 0)} />
        </label>
        <label className="field">
          <span>Sent to holders <b className="num">{holderPct}%</b></span>
          <input type="range" min="10" max="90" step="5" value={holderPct} onChange={(e) => setHolderPct(Number(e.target.value))} />
        </label>
        <label className="field">
          <span>Your share of eligible supply <b className="num">{supplyPct.toFixed(2)}%</b></span>
          <input type="range" min="0.01" max="5" step="0.01" value={supplyPct} onChange={(e) => setSupplyPct(Number(e.target.value))} />
        </label>
      </div>

      <div className="calc-out">
        <div className="split-bar" aria-hidden="true">
          <motion.div className="split-liq" animate={{ width: `${100 - holderPct}%` }} transition={{ duration: 0.7, ease: EASE }} />
          <motion.div className="split-hold" animate={{ width: `${holderPct}%` }} transition={{ duration: 0.7, ease: EASE }} />
        </div>
        <div className="split-legend">
          <span><i className="sw sw-liq" />Liquidity support <b className="num">{num(liquidity, 2)} oz</b></span>
          <span><i className="sw sw-hold" />Holder rewards <b className="num">{num(pool, 2)} oz</b></span>
        </div>
        <div className="calc-result">
          <span>You would earn</span>
          <strong className="gold-text"><CountUp value={yours} format={(v) => `${v.toFixed(4)} XAU`} duration={0.9} /></strong>
          <em>{price ? <CountUp value={yours * price} format={(v) => `about ${usd(v)}`} duration={0.9} /> : 'Live price loading'}</em>
        </div>
      </div>
    </div>
  );
}

export default function Vault() {
  const { svn, gold } = useLiveData();
  const price = gold.data?.price ?? null;
  const mcap = svn.data?.marketCap ?? null;
  const vol = svn.data?.volume24h ?? null;

  const hit = (mcap != null && TARGETS.marketCap && mcap >= TARGETS.marketCap) || (vol != null && TARGETS.volume24h && vol >= TARGETS.volume24h);
  const status = hit ? 'Unlocked' : TARGETS.marketCap || TARGETS.volume24h ? 'Locked' : 'Targets to be announced';

  return (
    <section className="section" id="vault">
      <div className="container">
        <ZFade className="section-head">
          <h2>When SVN grows, the vault pays.</h2>
          <p>
            The vault holds real XAU. Once SVN reaches a volume or market cap target, that gold goes to work in two ways
            at once: it deepens liquidity for the token, and it is paid out to holders in proportion to what they hold.
          </p>
        </ZFade>

        <ZFade>
          <div className="vault-board">
            <div className="vault-top">
              <div className="vault-state">
                <span className={`dot ${hit ? '' : 'off'}`} />
                <strong>{status}</strong>
              </div>
              <div className="vault-bal">
                <span>Vault balance</span>
                <strong>{RESERVE_XAU ? <CountUp value={RESERVE_XAU} format={(v) => `${num(v, 2)} oz`} /> : 'Not published'}</strong>
                {RESERVE_XAU && price ? <small>{usd(RESERVE_XAU * price, 0)}</small> : null}
              </div>
            </div>
            <div className="meters">
              <Meter label="Market cap" value={mcap} target={TARGETS.marketCap} />
              <Meter label="24 hour volume" value={vol} target={TARGETS.volume24h} />
            </div>
            <p className="vault-note">Either target is enough to unlock the vault.</p>
          </div>
        </ZFade>

        <div className="ticket stage-3d">
          <ZFade depth={380}>
            <Tilt max={5}>
              <article className="stub">
                <h3>Liquidity support</h3>
                <p>
                  Part of the vault&apos;s XAU is deployed as depth for the SVN market. A deeper pool means smaller price swings
                  and a tighter hold on the gold target.
                </p>
                <ul>
                  <li>Deployed only after a target is reached</li>
                  <li>Strengthens the SVN to XAU ratio</li>
                  <li>Amounts deployed are published</li>
                </ul>
                <span className="stub-foot">Goes to the pool</span>
              </article>
            </Tilt>
          </ZFade>
          <div className="perf" aria-hidden="true" />
          <ZFade depth={380}>
            <Tilt max={5}>
              <article className="stub stub-gold">
                <h3>Holder rewards</h3>
                <p>
                  The rest is paid to holders in XAU, in proportion to how much SVN each wallet holds when the snapshot is taken.
                  Hold more, earn a bigger share of the gold.
                </p>
                <ul>
                  <li>Paid in gold, not in more SVN</li>
                  <li>Share follows your balance at the snapshot</li>
                  <li>Claimed from your own wallet</li>
                </ul>
                <span className="stub-foot">Goes to wallets</span>
              </article>
            </Tilt>
          </ZFade>
        </div>

        <ZFade>
          <ol className="steps">
            {STEPS.map(([t, d], i) => (
              <li key={t}>
                <b className="num">{i + 1}</b>
                <h3>{t}</h3>
                <p>{d}</p>
              </li>
            ))}
          </ol>
        </ZFade>

        <ZFade>
          <div className="calc-wrap">
            <h3>Estimate your share</h3>
            <Calculator price={price} />
            <p className="vault-note">An illustration with editable numbers, not a promise. The real split, targets and snapshot rules are set in the contracts and published before launch. Rewards depend on the vault balance.</p>
          </div>
        </ZFade>
      </div>
    </section>
  );
}
