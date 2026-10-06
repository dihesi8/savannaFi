'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useWallet } from './WalletProvider';
import { short } from '@/lib/format';

export default function WalletButton({ small = true }) {
  const { account, onRightChain, connect, disconnect, switchChain } = useWallet();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const on = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', on);
    return () => document.removeEventListener('pointerdown', on);
  }, []);

  if (!account) return <button className={`btn btn-line ${small ? 'btn-sm' : ''}`} onClick={connect}>Connect wallet</button>;

  return (
    <div className="wallet" ref={ref}>
      <button className={`btn btn-line ${small ? 'btn-sm' : ''}`} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className={`dot ${onRightChain ? '' : 'off'}`} />{short(account)}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="wallet-menu" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
            <span>{onRightChain ? 'Robinhood Chain' : 'Wrong network'}</span>
            {!onRightChain && <button onClick={() => { switchChain(); setOpen(false); }}>Switch to Robinhood Chain</button>}
            <button onClick={() => { disconnect(); setOpen(false); }}>Disconnect</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
