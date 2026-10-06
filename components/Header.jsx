'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import WalletButton from './WalletButton';
import { Mark, Arrow } from './Art';
import { SVN } from '@/lib/config';

const LINKS = [
  ['Protocol', '#protocol'],
  ['Mechanism', '#mechanism'],
  ['Vault', '#vault'],
  ['Network', '#network'],
  ['Terminal', '#terminal'],
  ['Roadmap', '#roadmap'],
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const home = usePathname() === '/';
  const base = home ? '' : '/';

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const external = SVN.buyUrl.startsWith('http');
  const buyProps = external ? { target: '_blank', rel: 'noreferrer' } : {};

  return (
    <header className={`site-header ${scrolled || open ? 'scrolled' : ''}`}>
      <div className="container nav">
        <a className="brand" href={home ? '#top' : '/'} aria-label="SavannaFi home"><Mark /> SavannaFi</a>
        <nav className="nav-links" aria-label="Primary">
          {LINKS.map(([t, h]) => <a key={h} href={`${base}${h}`}>{t}</a>)}
        </nav>
        <div className="nav-actions desktop-only">
          {home ? (
            <Link className="btn btn-gold btn-sm" href="/app">Open farms <Arrow /></Link>
          ) : (
            <>
              <WalletButton />
              <a className="btn btn-gold btn-sm" href={external ? SVN.buyUrl : `/${SVN.buyUrl}`} {...buyProps}>Buy $SVN <Arrow /></a>
            </>
          )}
        </div>
        <button className={`menu-btn ${open ? 'open' : ''}`} aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <span /><span /><span />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div className="mobile-menu" initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.45, ease: [0.22, 0.8, 0.2, 1] }}>
            <nav onClick={() => setOpen(false)}>
              {LINKS.map(([t, h]) => <a key={h} href={`${base}${h}`}>{t}</a>)}
              {home ? (
                <Link className="btn btn-gold" href="/app">Open farms <Arrow /></Link>
              ) : (
                <>
                  <WalletButton small={false} />
                  <a className="btn btn-gold" href={external ? SVN.buyUrl : `/${SVN.buyUrl}`} {...buyProps}>Buy $SVN <Arrow /></a>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
