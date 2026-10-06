'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CHAIN } from '@/lib/config';

const Ctx = createContext(null);
export const useWallet = () => useContext(Ctx);

const TARGET = {
  chainId: CHAIN.hexId,
  chainName: CHAIN.name,
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: [CHAIN.rpc],
  blockExplorerUrls: [CHAIN.explorer],
};
const OFF = 'savannafi:wallet-off';

export default function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [hasProvider, setHasProvider] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const eth = window.ethereum;
    if (!eth) return;
    setHasProvider(true);
    const off = localStorage.getItem(OFF) === '1';
    if (!off) eth.request({ method: 'eth_accounts' }).then((a) => setAccount(a[0] || null)).catch(() => {});
    eth.request({ method: 'eth_chainId' }).then(setChainId).catch(() => {});
    const onAcc = (a) => { if (localStorage.getItem(OFF) !== '1') setAccount(a[0] || null); };
    const onChain = (c) => setChainId(c);
    eth.on?.('accountsChanged', onAcc);
    eth.on?.('chainChanged', onChain);
    return () => { eth.removeListener?.('accountsChanged', onAcc); eth.removeListener?.('chainChanged', onChain); };
  }, []);

  const connect = useCallback(async () => {
    setError('');
    const eth = window.ethereum;
    if (!eth) { setError('No wallet found. Install MetaMask or open this page in a wallet browser.'); return; }
    try {
      localStorage.removeItem(OFF);
      const a = await eth.request({ method: 'eth_requestAccounts' });
      setAccount(a[0] || null);
      setChainId(await eth.request({ method: 'eth_chainId' }));
    } catch (e) {
      setError(e?.code === 4001 ? 'Connection cancelled.' : 'Could not connect the wallet.');
    }
  }, []);

  const disconnect = useCallback(() => { localStorage.setItem(OFF, '1'); setAccount(null); }, []);

  const switchChain = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) return;
    try {
      await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: TARGET.chainId }] });
    } catch (e) {
      if (e?.code === 4902) {
        try { await eth.request({ method: 'wallet_addEthereumChain', params: [TARGET] }); } catch { setError('Could not add the network.'); }
      } else if (e?.code !== 4001) setError('Could not switch network.');
    }
  }, []);

  const onRightChain = chainId?.toLowerCase() === TARGET.chainId;

  return <Ctx.Provider value={{ account, chainId, hasProvider, error, onRightChain, connect, disconnect, switchChain }}>{children}</Ctx.Provider>;
}
