'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useWallet } from './WalletProvider';
import { POOLS, DEMO_SVN_BALANCE } from '@/lib/pools';

const Ctx = createContext(null);
export const useFarm = () => useContext(Ctx);
const YEAR_MS = 365 * 24 * 3600 * 1000;
const fresh = () => ({ balance: DEMO_SVN_BALANCE, stakes: {}, claimed: 0 });

// DEMO store. Stakes and rewards are simulated in the browser and kept per wallet address.
// Replace the three actions with contract writes when the staking contracts exist.
export default function FarmStore({ children }) {
  const { account } = useWallet();
  const key = account ? `savannafi:farm:${account.toLowerCase()}` : null;
  const [state, setState] = useState(fresh());
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!key) { setState(fresh()); return; }
    try { setState(JSON.parse(localStorage.getItem(key)) || fresh()); } catch { setState(fresh()); }
  }, [key]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const commit = useCallback((next) => {
    setState(next);
    if (key) try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  }, [key]);

  const pending = useCallback((id) => {
    const st = state.stakes[id];
    if (!st) return 0;
    const apy = POOLS.find((p) => p.id === id).apy / 100;
    return st.accrued + st.amount * apy * ((now - st.since) / YEAR_MS);
  }, [state, now]);

  const settle = (id, t) => {
    const st = state.stakes[id];
    return st ? { ...st, accrued: pending(id), since: t } : { amount: 0, accrued: 0, since: t };
  };

  const stake = useCallback((id, amt) => {
    const t = Date.now();
    const cur = settle(id, t);
    commit({ ...state, balance: state.balance - amt, stakes: { ...state.stakes, [id]: { ...cur, amount: cur.amount + amt } } });
  }, [state, commit, now]); // eslint-disable-line react-hooks/exhaustive-deps

  const unstake = useCallback((id, amt) => {
    const t = Date.now();
    const cur = settle(id, t);
    commit({ ...state, balance: state.balance + amt, stakes: { ...state.stakes, [id]: { ...cur, amount: Math.max(0, cur.amount - amt) } } });
  }, [state, commit, now]); // eslint-disable-line react-hooks/exhaustive-deps

  const claim = useCallback((id) => {
    const t = Date.now();
    const cur = settle(id, t);
    const got = cur.accrued;
    commit({ ...state, balance: state.balance + got, claimed: state.claimed + got, stakes: { ...state.stakes, [id]: { ...cur, accrued: 0 } } });
    return got;
  }, [state, commit, now]); // eslint-disable-line react-hooks/exhaustive-deps

  const totals = useMemo(() => {
    let staked = 0, rewards = 0;
    for (const p of POOLS) { staked += state.stakes[p.id]?.amount || 0; rewards += pending(p.id); }
    return { staked, rewards };
  }, [state, pending]);

  return <Ctx.Provider value={{ ...state, pending, stake, unstake, claim, totals }}>{children}</Ctx.Provider>;
}
