'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ZFade from './ZFade';
import { Arrow } from './Art';

const MODES = {
  above: {
    theme: 'light',
    state: 'Expansion',
    title: 'SVN is above its gold target.',
    text: 'Supply expands. The new SVN is routed toward MSHARE holders, which pulls the price back down to target.',
    flow: ['SVN above', 'Expansion', 'MSHARE', 'Supply grows'],
    coins: 7,
    readout: ['Supply', 'Expanding'],
  },
  below: {
    theme: 'dark',
    state: 'Contraction',
    title: 'SVN is below its gold target.',
    text: 'Supply contracts. MBOND takes SVN out of circulation and pays it back when the price recovers.',
    flow: ['SVN below', 'Contraction', 'MBOND', 'Supply shrinks'],
    coins: 3,
    readout: ['Supply', 'Contracting'],
  },
};

const MAX = 7;

function CoinStack({ count }) {
  const coins = Array.from({ length: MAX }, (_, i) => i);
  return (
    <svg viewBox="0 0 240 300" role="img" aria-label={`Stack of ${count} gold coins`}>
      <defs>
        <linearGradient id="cs-top" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ebd38b" /><stop offset="1" stopColor="#c9a24b" /></linearGradient>
        <linearGradient id="cs-side" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8a6a25" /><stop offset="0.45" stopColor="#c9a24b" /><stop offset="1" stopColor="#7a5a1c" /></linearGradient>
      </defs>
      <motion.ellipse cx="120" cy="262" rx="92" ry="20" fill="#000" animate={{ opacity: 0.16 + count * 0.03 }} transition={{ duration: 0.8 }} />
      {coins.map((i) => {
        const y = 240 - i * 24;
        const on = i < count;
        return (
          <motion.g
            key={i}
            initial={false}
            animate={{ opacity: on ? 1 : 0, y: on ? 0 : -70, scale: on ? 1 : 0.94 }}
            transition={{ duration: 0.7, delay: on ? i * 0.06 : (MAX - i) * 0.04, ease: [0.22, 0.8, 0.2, 1] }}
            style={{ transformOrigin: '120px 240px' }}
          >
            <path d={`M30 ${y} v14 a90 24 0 0 0 180 0 v-14`} fill="url(#cs-side)" />
            <ellipse cx="120" cy={y} rx="90" ry="24" fill="url(#cs-top)" />
            <ellipse cx="120" cy={y} rx="74" ry="18" fill="none" stroke="#8a6a25" strokeOpacity="0.55" strokeWidth="1.2" />
          </motion.g>
        );
      })}
    </svg>
  );
}

export default function Mechanism() {
  const [mode, setMode] = useState('above');
  const d = MODES[mode];

  return (
    <section className="section mech" id="mechanism" data-theme={d.theme}>
      <div className="container">
        <ZFade className="section-head">
          <h2>Watch the protocol react.</h2>
        </ZFade>

        <ZFade>
          <div className="toggle" data-mode={mode} role="tablist" aria-label="Price relative to target">
            <span className="toggle-pill" />
            {Object.entries({ above: 'Above target', below: 'Below target' }).map(([k, label]) => (
              <button key={k} role="tab" aria-selected={mode === k} onClick={() => setMode(k)}>{label}</button>
            ))}
          </div>

          <div className="mech-panel">
            <div className="mech-copy">
              <AnimatePresence mode="wait">
                <motion.div key={mode} initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }} transition={{ duration: 0.45, ease: [0.22, 0.8, 0.2, 1] }}>
                  <span className="mech-state"><span className="dot" />{d.state}</span>
                  <h3>{d.title}</h3>
                  <p>{d.text}</p>
                </motion.div>
              </AnimatePresence>
              <div className="flow">
                {d.flow.map((s, i) => (
                  <motion.span key={`${mode}-${s}`} className="flow-step" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.09, duration: 0.5, ease: [0.22, 0.8, 0.2, 1] }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    {s}{i < d.flow.length - 1 && <Arrow />}
                  </motion.span>
                ))}
              </div>
            </div>
            <div className="mech-visual">
              <CoinStack count={d.coins} />
              <div className="mech-readout"><span>Target</span><strong>1 SVN = 1 XAU</strong><span>{d.readout[0]}</span><strong>{d.readout[1]}</strong></div>
            </div>
          </div>
        </ZFade>
      </div>
    </section>
  );
}
