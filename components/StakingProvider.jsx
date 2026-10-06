'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPublicClient, createWalletClient, custom, defineChain, http, formatUnits, parseUnits } from 'viem';
import { stakingAbi, erc20Abi } from '@/lib/stakingAbi';
import { CHAIN, STAKING } from '@/lib/config';
import { POOLS } from '@/lib/pools';
import { useWallet } from './WalletProvider';

const Ctx = createContext(null);
export const useStaking = () => useContext(Ctx);

const chain = defineChain({
  id: CHAIN.id,
  name: CHAIN.name,
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [CHAIN.rpc] } },
  blockExplorers: { default: { name: 'Explorer', url: CHAIN.explorer } },
});

const friendly = (e) => {
  const m = `${e?.shortMessage || ''} ${e?.message || ''} ${e?.details || ''}`;
  if (e?.code === 4001 || /User rejected|denied|rejected/i.test(m)) return 'Transaction cancelled.';
  if (/CapExceeded/.test(m)) return 'This pool has reached its limit.';
  if (/PoolDisabled/.test(m)) return 'This pool is not accepting new stakes.';
  if (/EnforcedPause/.test(m)) return 'Staking is paused right now.';
  if (/InsufficientStake/.test(m)) return 'You do not have that much staked.';
  if (/FaucetCooldown/.test(m)) return 'The test faucet is on cooldown. Try again in an hour.';
  if (/insufficient funds/i.test(m)) return 'Not enough ETH for network fees.';
  return e?.shortMessage || 'The transaction failed.';
};

export default function StakingProvider({ children }) {
  const { account, onRightChain } = useWallet();
  const configured = !!STAKING.address;
  const address = STAKING.address;

  const client = useMemo(
    () => (typeof window === 'undefined' ? null : createPublicClient({ chain, transport: http(`${window.location.origin}/api/rpc`) })),
    []
  );

  const [token, setToken] = useState(null); // { address, decimals, symbol }
  const [overview, setOverview] = useState(null); // { enabled, caps, totals, stakers }
  const [paused, setPaused] = useState(false);
  const [mine, setMine] = useState(null); // bigint[]
  const [balance, setBalance] = useState(0n);
  const [allowance, setAllowance] = useState(0n);
  const [loadError, setLoadError] = useState(false);
  const [tx, setTx] = useState({ status: 'idle' });
  const tokenRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!client || !configured) return;
    try {
      if (!tokenRef.current) {
        const addr = await client.readContract({ address, abi: stakingAbi, functionName: 'stakingToken' });
        const [decimals, symbol] = await Promise.all([
          client.readContract({ address: addr, abi: erc20Abi, functionName: 'decimals' }),
          client.readContract({ address: addr, abi: erc20Abi, functionName: 'symbol' }).catch(() => 'SVN'),
        ]);
        tokenRef.current = { address: addr, decimals: Number(decimals), symbol };
        setToken(tokenRef.current);
      }
      const t = tokenRef.current;
      const reads = [
        client.readContract({ address, abi: stakingAbi, functionName: 'poolsOverview' }),
        client.readContract({ address, abi: stakingAbi, functionName: 'paused' }),
      ];
      if (account) {
        reads.push(
          client.readContract({ address, abi: stakingAbi, functionName: 'userStakes', args: [account] }),
          client.readContract({ address: t.address, abi: erc20Abi, functionName: 'balanceOf', args: [account] }),
          client.readContract({ address: t.address, abi: erc20Abi, functionName: 'allowance', args: [account, address] })
        );
      }
      const [ov, p, m, b, a] = await Promise.all(reads);
      setOverview({ enabled: [...ov[0]], caps: [...ov[1]], totals: [...ov[2]], stakers: [...ov[3]] });
      setPaused(p);
      if (account) { setMine([...m]); setBalance(b); setAllowance(a); } else { setMine(null); setBalance(0n); setAllowance(0n); }
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, [client, configured, address, account]);

  useEffect(() => {
    if (!configured) return;
    refresh();
    const t = setInterval(() => { if (!document.hidden) refresh(); }, 12000);
    return () => clearInterval(t);
  }, [refresh, configured]);

  const run = useCallback(async (label, send) => {
    if (!client || !account || !window.ethereum) return false;
    setTx({ status: 'wallet', label });
    try {
      const wallet = createWalletClient({ account, chain, transport: custom(window.ethereum) });
      const hash = await send(wallet);
      setTx({ status: 'pending', label, hash });
      const receipt = await client.waitForTransactionReceipt({ hash, timeout: 120000 });
      if (receipt.status !== 'success') throw new Error('The transaction was reverted.');
      setTx({ status: 'done', label, hash });
      await refresh();
      return true;
    } catch (e) {
      setTx({ status: 'error', label, error: friendly(e) });
      return false;
    }
  }, [client, account, refresh]);

  const t = token;
  const approve = (amount) => run('Approve', (w) => w.writeContract({ address: t.address, abi: erc20Abi, functionName: 'approve', args: [address, amount] }));
  const stake = (poolId, amount) => run('Stake', (w) => w.writeContract({ address, abi: stakingAbi, functionName: 'stake', args: [BigInt(poolId), amount] }));
  const unstake = (poolId, amount) => run('Unstake', (w) => w.writeContract({ address, abi: stakingAbi, functionName: 'unstake', args: [BigInt(poolId), amount] }));
  const unstakeAll = (poolId) => run('Unstake', (w) => w.writeContract({ address, abi: stakingAbi, functionName: 'unstakeAll', args: [BigInt(poolId)] }));
  const faucet = () => t && run('Test SVN', (w) => w.writeContract({ address: t.address, abi: erc20Abi, functionName: 'faucet' }));

  const decimals = t?.decimals ?? 18;
  const toUnits = (v) => { try { return v ? parseUnits(v, decimals) : 0n; } catch { return null; } };
  const fromUnits = (v) => formatUnits(v ?? 0n, decimals);
  const asNumber = (v) => Number(formatUnits(v ?? 0n, decimals));

  const totals = useMemo(() => {
    const total = overview ? overview.totals.reduce((a, b) => a + b, 0n) : 0n;
    const mineTotal = mine ? mine.reduce((a, b) => a + b, 0n) : 0n;
    const positions = overview ? overview.stakers.reduce((a, b) => a + b, 0n) : 0n;
    return { total, mineTotal, positions };
  }, [overview, mine]);

  return (
    <Ctx.Provider value={{
      configured, token, overview, paused, mine, balance, allowance, loadError, tx, setTx, totals,
      approve, stake, unstake, unstakeAll, faucet, refresh, toUnits, fromUnits, asNumber,
      ready: configured && !!overview && !!token, onRightChain, account,
    }}>
      {children}
    </Ctx.Provider>
  );
}
