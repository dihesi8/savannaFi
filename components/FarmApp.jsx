'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStaking } from './StakingProvider';
import { useWallet } from './WalletProvider';
import { useLiveData } from './LiveProvider';
import CountUp from './CountUp';
import Spark from './Spark';
import PoolBadge from './PoolBadge';
import { POOLS } from '@/lib/pools';
import { CHAIN, STAKING } from '@/lib/config';
import { usd, num } from '@/lib/format';

const EASE = [0.22, 0.8, 0.2, 1];
const tokens = (v) => (n) => `${num(n, n >= 1000 ? 0 : 2)} ${v}`;

function useQuote(symbol) {
  const { stocks } = useLiveData();
  return stocks.data?.quotes?.[symbol];
}

function PriceCell({ symbol }) {
  const q = useQuote(symbol);
  const prev = useRef(null);
  const [flash, setFlash] = useState('');
  useEffect(() => {
    if (!q) return;
    if (prev.current != null && q.price !== prev.current) {
      setFlash(q.price > prev.current ? 'up' : 'down');
      const t = setTimeout(() => setFlash(''), 1200);
      prev.current = q.price;
      return () => clearTimeout(t);
    }
    prev.current = q.price;
  }, [q]);
  if (!q) return <div className="cell-price"><span className="pending">Loading</span></div>;
  const up = q.changePct >= 0;
  return (
    <div className="cell-price">
      <strong className={`flash ${flash}`}><CountUp value={q.price} format={(v) => usd(v)} duration={1.4} /></strong>
      <small className={up ? 'up' : ''}>{up ? '+' : ''}{q.changePct.toFixed(2)}%</small>
    </div>
  );
}

function Summary() {
  const s = useStaking();
  const { account } = useWallet();
  const sym = s.token?.symbol || 'SVN';
  const f = tokens(sym);
  return (
    <div className="farm-summary">
      <div><span>Wallet balance</span><strong>{account && s.ready ? <CountUp value={s.asNumber(s.balance)} format={f} /> : 'Not connected'}</strong></div>
      <div><span>Your staked</span><strong>{account && s.ready ? <CountUp value={s.asNumber(s.totals.mineTotal)} format={f} /> : 'None'}</strong></div>
      <div><span>Total staked</span><strong>{s.ready ? <CountUp value={s.asNumber(s.totals.total)} format={f} /> : 'Soon'}</strong></div>
      <div><span>Open positions</span><strong>{s.ready ? <CountUp value={Number(s.totals.positions)} format={(v) => num(v)} /> : 'Soon'}</strong></div>
    </div>
  );
}

function Row({ pool, index, onOpen }) {
  const s = useStaking();
  const { account } = useWallet();
  const q = useQuote(pool.symbol);
  const f = tokens(s.token?.symbol || 'SVN');
  const mineAmt = s.mine?.[index] ?? 0n;
  const live = s.ready;
  return (
    <motion.div className="pool-row" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '0px 0px -8% 0px' }} transition={{ duration: 0.6, ease: EASE }}>
      <div className="cell-pool"><PoolBadge symbol={pool.symbol} /><div><strong>{pool.name}</strong><small>{pool.symbol}</small></div></div>
      <PriceCell symbol={pool.symbol} />
      <div className="cell-spark"><Spark data={q?.spark} up={(q?.changePct ?? 0) >= 0} /></div>
      <div className="cell-tvl"><span>Total staked</span><strong className="num">{live ? f(s.asNumber(s.overview.totals[index])) : 'Soon'}</strong></div>
      <div className="cell-stakers"><span>Stakers</span><strong className="num">{live ? num(Number(s.overview.stakers[index])) : 'Soon'}</strong></div>
      <div className="cell-mine"><span>Your stake</span><strong className="num">{account && live && mineAmt > 0n ? f(s.asNumber(mineAmt)) : 'None'}</strong></div>
      <button className="btn btn-line btn-sm" onClick={() => onOpen(index)}>{mineAmt > 0n ? 'Manage' : 'Stake'}</button>
    </motion.div>
  );
}

function TxLine({ tx }) {
  if (tx.status === 'idle') return null;
  const link = tx.hash ? <a href={`${CHAIN.explorer}/tx/${tx.hash}`} target="_blank" rel="noreferrer">View transaction</a> : null;
  const text = {
    wallet: `Confirm ${tx.label.toLowerCase()} in your wallet`,
    pending: `${tx.label} submitted, waiting for confirmation`,
    done: `${tx.label} confirmed`,
    error: tx.error,
  }[tx.status];
  return (
    <div className={`tx-line ${tx.status}`} role="status">
      {(tx.status === 'wallet' || tx.status === 'pending') && <span className="spin" aria-hidden="true" />}
      <span>{text}</span>{link}
    </div>
  );
}

function Manage({ index, onClose, toast }) {
  const pool = POOLS[index];
  const s = useStaking();
  const { account, onRightChain, connect, switchChain } = useWallet();
  const q = useQuote(pool.symbol);
  const [tab, setTab] = useState('stake');
  const [amt, setAmt] = useState('');
  const busy = s.tx.status === 'wallet' || s.tx.status === 'pending';
  const sym = s.token?.symbol || 'SVN';
  const f = tokens(sym);

  const staked = s.mine?.[index] ?? 0n;
  const total = s.overview?.totals[index] ?? 0n;
  const cap = s.overview?.caps[index] ?? 0n;
  const enabled = s.overview?.enabled[index] ?? true;
  const maxBig = tab === 'stake' ? s.balance : staked;
  const parsed = s.toUnits(amt);
  const valid = parsed != null && parsed > 0n && parsed <= maxBig;
  const isMax = parsed != null && parsed === staked && staked > 0n;
  const needsApproval = tab === 'stake' && valid && s.allowance < parsed;
  const room = cap > 0n ? (cap > total ? cap - total : 0n) : null;
  const blocked = tab === 'stake' && (s.paused || !enabled);

  useEffect(() => {
    s.setTx({ status: 'idle' });
    const on = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    if (!valid || busy) return;
    if (tab === 'stake') {
      if (needsApproval) { await s.approve(parsed); return; }
      if (await s.stake(index, parsed)) { toast(`Staked ${f(Number(s.fromUnits(parsed)))} in the ${pool.symbol} pool`); setAmt(''); }
    } else {
      const ok = isMax ? await s.unstakeAll(index) : await s.unstake(index, parsed);
      if (ok) { toast(`Unstaked ${f(Number(s.fromUnits(parsed)))} from the ${pool.symbol} pool`); setAmt(''); }
    }
  };

  let action;
  if (!STAKING.address) action = <button className="btn btn-gold" disabled>Staking opens soon</button>;
  else if (!account) action = <button className="btn btn-gold" onClick={connect}>Connect wallet</button>;
  else if (!onRightChain) action = <button className="btn btn-gold" onClick={switchChain}>Switch to {CHAIN.name}</button>;
  else if (!s.ready) action = <button className="btn btn-gold" disabled>Loading</button>;
  else if (blocked) action = <button className="btn btn-gold" disabled>{s.paused ? 'Staking is paused' : 'Pool is closed to new stakes'}</button>;
  else action = (
    <button className="btn btn-gold" disabled={!valid || busy} onClick={submit}>
      {busy ? 'Working...' : tab === 'unstake' ? 'Unstake' : needsApproval ? `Approve ${sym}` : `Stake ${sym}`}
    </button>
  );

  return (
    <motion.div className="modal-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div className="modal" role="dialog" aria-modal="true" aria-label={`${pool.name} pool`} data-lenis-prevent initial={{ opacity: 0, y: 40, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.97 }} transition={{ duration: 0.45, ease: EASE }}>
        <div className="modal-head">
          <div className="cell-pool"><PoolBadge symbol={pool.symbol} /><div><strong>{pool.name} pool</strong><small>{q ? `${pool.symbol} ${usd(q.price)}` : pool.symbol}</small></div></div>
          <button className="modal-x" onClick={onClose} aria-label="Close"><span /><span /></button>
        </div>

        <div className="modal-stats">
          <div><span>Your stake</span><strong className="num">{f(s.asNumber(staked))}</strong></div>
          <div><span>Pool total</span><strong className="num">{f(s.asNumber(total))}</strong></div>
          <div><span>Wallet</span><strong className="num">{f(s.asNumber(s.balance))}</strong></div>
        </div>

        <div className="seg" role="tablist">
          {['stake', 'unstake'].map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => { setTab(t); setAmt(''); s.setTx({ status: 'idle' }); }}>{t === 'stake' ? 'Stake' : 'Unstake'}{tab === t && <motion.i layoutId="seg" transition={{ type: 'spring', stiffness: 320, damping: 30 }} />}</button>
          ))}
        </div>

        <label className="amount">
          <span>Amount <em>Available {f(s.asNumber(maxBig))}</em></span>
          <div className="amount-box">
            <input inputMode="decimal" placeholder="0.00" value={amt} onChange={(e) => setAmt(e.target.value.replace(/[^0-9.]/g, ''))} disabled={busy} />
            <b>{sym}</b>
          </div>
        </label>
        <div className="quick">
          {[25, 50, 75, 100].map((p) => (
            <button key={p} disabled={busy} onClick={() => setAmt(p === 100 ? s.fromUnits(maxBig) : s.fromUnits((maxBig * BigInt(p)) / 100n))}>{p === 100 ? 'Max' : `${p}%`}</button>
          ))}
        </div>

        {tab === 'stake' && room != null && <p className="vault-note">Room left in this pool: {f(s.asNumber(room))}</p>}
        {needsApproval && <p className="vault-note">Step 1 of 2: approve the contract to move this amount. Step 2: stake.</p>}
        {amt && parsed != null && parsed > maxBig && <p className="farm-error">That is more than you have available.</p>}

        <div className="modal-actions">{action}</div>
        <TxLine tx={s.tx} />
        <p className="vault-note">You can unstake at any time. Smart contracts carry risk, so only stake what you are comfortable with.</p>
      </motion.div>
    </motion.div>
  );
}

export default function FarmApp() {
  const { stocks } = useLiveData();
  const s = useStaking();
  const { error } = useWallet();
  const [active, setActive] = useState(null);
  const [msg, setMsg] = useState('');
  const timer = useRef(null);
  const toast = (m) => { setMsg(m); clearTimeout(timer.current); timer.current = setTimeout(() => setMsg(''), 3600); };
  const live = !!stocks.data && !stocks.error;

  return (
    <main className="farm-page">
      <div className="container">
        <motion.div className="farm-head" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE }}>
          <h1>Yield farms</h1>
          <p>Stake SVN into a stock pool to support its liquidity on Robinhood Chain. Unstake any time.</p>
          <div className="farm-badges">
            <span className="chip"><span className={`dot ${live ? '' : 'off'}`} />Stock prices {live ? `live via ${stocks.data.source}` : 'connecting'}</span>
            <span className="chip"><span className={`dot ${s.ready && !s.loadError ? '' : 'off'}`} />{CHAIN.name}</span>
            {STAKING.testFaucet && s.ready && s.account && s.onRightChain && (
              <button className="chip chip-btn" onClick={async () => { if (await s.faucet()) toast('10,000 test SVN sent to your wallet'); }}>Get test SVN</button>
            )}
          </div>
        </motion.div>

        <Summary />
        {(error || s.loadError) && <p className="farm-error">{error || 'Could not read the staking contract. Retrying.'}</p>}
        {s.tx.status === 'error' && !active && <p className="farm-error">{s.tx.error}</p>}

        <div className="pool-list">
          {POOLS.map((p, i) => <Row key={p.id} pool={p} index={i} onOpen={setActive} />)}
        </div>
        <p className="vault-note">Stock prices can be delayed up to 15 minutes and are shown for reference. Tokenized stocks may not be available in every region.</p>
      </div>

      <AnimatePresence>{active != null && <Manage key={active} index={active} onClose={() => setActive(null)} toast={toast} />}</AnimatePresence>
      <AnimatePresence>{msg && <motion.div className="toast" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.35, ease: EASE }}>{msg}</motion.div>}</AnimatePresence>
    </main>
  );
}
