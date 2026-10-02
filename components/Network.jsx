'use client';
import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import ZFade from './ZFade';
import Tilt from './Tilt';
import { useLiveData } from './LiveProvider';
import { CHAIN } from '@/lib/config';
import { usd, num } from '@/lib/format';

const N = { xau: { x: 300, y: 96 }, svn: { x: 118, y: 410 }, chain: { x: 482, y: 410 }, vault: { x: 300, y: 300 } };

const EDGES = [
  { id: 'xau-svn', a: 'xau', b: 'svn', nodes: ['xau', 'svn'], label: 'Tracks 1 oz' },
  { id: 'svn-chain', a: 'svn', b: 'chain', nodes: ['svn', 'chain'], label: 'Trades and settles' },
  { id: 'chain-xau', a: 'chain', b: 'xau', nodes: ['chain', 'xau'], label: 'Vault XAU' },
];

const COPY = {
  svn: { title: 'SVN', line: 'The asset people hold.', body: 'SVN trades on Robinhood Chain and is designed to track one ounce of gold. Holders share in the vault once a milestone is reached.' },
  xau: { title: 'XAU', line: 'The target and the reserve.', body: 'The live gold price sets the target SVN is measured against. Gold in the vault backs liquidity support and holder payouts.' },
  chain: { title: 'Robinhood Chain', line: 'The home network.', body: 'An Arbitrum Orbit layer 2 with gas paid in ETH. SVN trades and settles here, and the vault is tracked here.' },
};

function Particle({ from, to, dur, begin }) {
  const d = `M${N[from].x} ${N[from].y} L${N[to].x} ${N[to].y}`;
  return (
    <circle r="3.6" fill="#e4c777">
      <animateMotion dur={dur} begin={begin} repeatCount="indefinite" path={d} />
      <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur={dur} begin={begin} repeatCount="indefinite" />
    </circle>
  );
}

export default function Network() {
  const { gold, chain, svn } = useLiveData();
  const reduce = useReducedMotion();
  const [active, setActive] = useState('svn');

  const price = gold.data?.price;
  const live = {
    xau: price ? usd(price) : 'Connecting',
    chain: chain.data?.block ? `Block ${num(chain.data.block)}` : 'Connecting',
    svn: svn.data?.priceUsd ? usd(svn.data.priceUsd, svn.data.priceUsd < 1 ? 6 : 2) : 'Awaiting CA',
  };

  const edgeOn = (e) => e.nodes.includes(active);
  const nodeProps = (k) => ({
    tabIndex: 0,
    role: 'button',
    'aria-label': COPY[k].title,
    onMouseEnter: () => setActive(k),
    onFocus: () => setActive(k),
    onClick: () => setActive(k),
    className: `net-node ${active === k ? 'on' : ''}`,
  });

  return (
    <section className="section" id="network">
      <div className="container net-layout">
        <div>
          <ZFade className="section-head">
            <h2>Gold, a token and a chain.</h2>
            <p>Three parts, one loop. Pick a node to see what it does and which links it drives.</p>
          </ZFade>
          <ZFade>
            <div className="net-list" role="tablist">
              {Object.entries(COPY).map(([k, c]) => (
                <button key={k} role="tab" aria-selected={active === k} className={`net-item ${active === k ? 'on' : ''}`} onMouseEnter={() => setActive(k)} onClick={() => setActive(k)}>
                  <span className="net-item-head"><strong>{c.title}</strong><em className="num">{live[k]}</em></span>
                  <AnimatePresence initial={false}>
                    {active === k && (
                      <motion.span className="net-item-body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease: [0.22, 0.8, 0.2, 1] }}>
                        <b>{c.line}</b>
                        <span>{c.body}</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              ))}
            </div>
          </ZFade>
        </div>

        <ZFade className="stage-3d">
          <Tilt max={4}>
            <div className="net-panel">
              <svg viewBox="0 0 600 520" role="img" aria-label="SVN, XAU and Robinhood Chain relationship diagram">
                <defs>
                  <radialGradient id="net-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0" stopColor="#c9a24b" stopOpacity="0.22" />
                    <stop offset="1" stopColor="#c9a24b" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="net-coin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ebd38b" /><stop offset="1" stopColor="#a98232" /></linearGradient>
                  <linearGradient id="net-bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e6cb82" /><stop offset="1" stopColor="#b08b38" /></linearGradient>
                </defs>

                <circle cx="300" cy="300" r="250" fill="url(#net-glow)" />
                {[120, 190, 260].map((r) => <circle key={r} cx="300" cy="300" r={r} fill="none" stroke="rgba(201,162,75,0.1)" strokeDasharray="2 8" />)}

                {/* vault spokes */}
                {['xau', 'svn', 'chain'].map((k) => (
                  <line key={k} x1={N.vault.x} y1={N.vault.y} x2={N[k].x} y2={N[k].y} stroke="rgba(201,162,75,0.16)" strokeWidth="1" strokeDasharray="3 6" />
                ))}

                {EDGES.map((e) => {
                  const mx = (N[e.a].x + N[e.b].x) / 2;
                  const my = (N[e.a].y + N[e.b].y) / 2;
                  return (
                    <g key={e.id} className={`net-edge ${edgeOn(e) ? 'on' : ''}`}>
                      <line x1={N[e.a].x} y1={N[e.a].y} x2={N[e.b].x} y2={N[e.b].y} />
                      <g transform={`translate(${mx} ${my})`}>
                        <rect x="-62" y="-14" width="124" height="28" rx="14" />
                        <text textAnchor="middle" y="5">{e.label}</text>
                      </g>
                    </g>
                  );
                })}

                {!reduce && (
                  <g>
                    <Particle from="xau" to="svn" dur="3.6s" begin="0s" />
                    <Particle from="svn" to="chain" dur="3.6s" begin="1.2s" />
                    <Particle from="chain" to="xau" dur="3.6s" begin="2.4s" />
                  </g>
                )}

                {/* vault */}
                <g>
                  <circle cx={N.vault.x} cy={N.vault.y} r="34" fill="rgba(8,24,15,0.85)" stroke="#c9a24b" strokeOpacity="0.6" />
                  <circle cx={N.vault.x} cy={N.vault.y} r="26" fill="none" stroke="#c9a24b" strokeOpacity="0.35" strokeDasharray="2 4" />
                  <text x={N.vault.x} y={N.vault.y + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="#e4c777" fontFamily="'Hanken Grotesk', sans-serif">Vault</text>
                </g>

                {/* XAU */}
                <g {...nodeProps('xau')} transform={`translate(${N.xau.x} ${N.xau.y})`}>
                  <circle r="62" className="halo" />
                  <path d="M-34 14 L34 14 L44 -14 L-44 -14 Z" fill="url(#net-bar)" stroke="#8a6a25" strokeWidth="1.2" />
                  <path d="M-44 -14 L-34 -26 L34 -26 L44 -14 Z" fill="#f0d994" opacity="0.85" />
                  <text y="4" textAnchor="middle" fontSize="13" fontWeight="700" fill="#6f5217" fontFamily="'Bodoni Moda', Georgia, serif">XAU</text>
                  <text y="52" textAnchor="middle" className="nlabel">Gold</text>
                  <text y="72" textAnchor="middle" className="nvalue">{live.xau}</text>
                </g>

                {/* SVN */}
                <g {...nodeProps('svn')} transform={`translate(${N.svn.x} ${N.svn.y})`}>
                  <circle r="62" className="halo" />
                  <circle r="38" fill="url(#net-coin)" stroke="#f0d994" strokeWidth="1.5" />
                  <circle r="30" fill="none" stroke="#8a6a25" strokeOpacity="0.7" strokeDasharray="2 4" />
                  <text y="9" textAnchor="middle" fontSize="23" fontWeight="700" fill="#6f5217" fontFamily="'Bodoni Moda', Georgia, serif">SVN</text>
                  <text y="62" textAnchor="middle" className="nlabel">SavannaFi token</text>
                  <text y="82" textAnchor="middle" className="nvalue">{live.svn}</text>
                </g>

                {/* Robinhood Chain */}
                <g {...nodeProps('chain')} transform={`translate(${N.chain.x} ${N.chain.y})`}>
                  <circle r="62" className="halo" />
                  <path d="M0 -40 L35 -20 L35 20 L0 40 L-35 20 L-35 -20 Z" fill="rgba(14,42,31,0.95)" stroke="#c9a24b" strokeWidth="1.6" />
                  <path d="M0 -28 L24 -14 L24 14 L0 28 L-24 14 L-24 -14 Z" fill="none" stroke="#c9a24b" strokeOpacity="0.4" />
                  <text y="6" textAnchor="middle" fontSize="16" fontWeight="700" fill="#e4c777" fontFamily="'Hanken Grotesk', sans-serif">{CHAIN.id}</text>
                  <text y="62" textAnchor="middle" className="nlabel">Robinhood Chain</text>
                  <text y="82" textAnchor="middle" className="nvalue">{live.chain}</text>
                </g>
              </svg>
            </div>
          </Tilt>
        </ZFade>
      </div>
    </section>
  );
}
