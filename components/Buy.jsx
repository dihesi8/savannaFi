'use client';
import { useState } from 'react';
import ZFade from './ZFade';
import { CoinFace, Arrow } from './Art';
import { SVN } from '@/lib/config';

export default function Buy() {
  const [copied, setCopied] = useState(false);
  const ca = SVN.contractAddress;
  const external = SVN.buyUrl.startsWith('http');

  const copy = async () => {
    try { await navigator.clipboard.writeText(ca); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch {}
  };

  return (
    <section className="section buy" id="svn">
      <div className="container">
        <ZFade>
          <CoinFace id="buy" label="SVN" sub="AU 999.9" className="buy-coin" />
          <h2>Hold SVN on Robinhood Chain.</h2>
          <div className="ca">
            <span className={ca ? 'set' : ''}>{ca || 'Contract address to be announced'}</span>
            {ca && <button className="btn btn-line btn-sm" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>}
          </div>
          <div className="hero-actions">
            <a className="btn btn-gold" href={SVN.buyUrl} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>Buy $SVN <Arrow /></a>
          </div>
        </ZFade>
      </div>
    </section>
  );
}
