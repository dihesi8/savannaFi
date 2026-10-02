'use client';
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import ZFade from './ZFade';

const STEPS = [
  ['Phase 1', 'Foundation', 'Contracts, reserve design and the live terminal.'],
  ['Phase 2', 'Mechanism', 'SVN, MSHARE and MBOND go on chain.'],
  ['Phase 3', 'Liquidity', 'Pools, integrations and real use for SVN.'],
  ['Phase 4', 'Cross-chain', 'SVN reaches more networks.'],
];

export default function Roadmap() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 60%'] });
  const fill = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section className="section" id="roadmap">
      <div className="container">
        <ZFade className="section-head"><h2>The road ahead.</h2></ZFade>
        <ZFade>
          <div className="road" ref={ref}>
            <div className="road-rail"><motion.div className="road-fill" style={{ scaleX: fill }} /></div>
            {STEPS.map(([p, t, d]) => (
              <div className="road-step" key={t}>
                <span className="road-dot" />
                <small>{p}</small>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </ZFade>
      </div>
    </section>
  );
}
