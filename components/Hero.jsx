'use client';
import { motion } from 'framer-motion';
import SceneFrame from './SceneFrame';
import CountUp from './CountUp';
import { Arrow } from './Art';
import { useLiveData } from './LiveProvider';
import ZFade from './ZFade';
import { SVN } from '@/lib/config';
import { usd, num } from '@/lib/format';

const rise = (d) => ({ initial: { opacity: 0, y: 28 }, animate: { opacity: 1, y: 0 }, transition: { duration: 1.1, delay: d, ease: [0.22, 0.8, 0.2, 1] } });

export default function Hero() {
  const { gold, chain } = useLiveData();
  const price = gold.data?.price;
  const block = chain.data?.block;
  const external = SVN.buyUrl.startsWith('http');

  return (
    <section className="hero" id="top">
      <motion.div className="hero-scene" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.6, delay: 0.3, ease: [0.22, 0.8, 0.2, 1] }}>
        <SceneFrame kind="hero" className="hero-scene" />
      </motion.div>

      <div className="container">
        <ZFade className="hero-copy" enter={false} depth={700}>
          <motion.h1 {...rise(0.15)}>
            <span>Algorithmic gold</span>
            <span className="gold-text">on Robinhood Chain.</span>
          </motion.h1>
          <motion.p className="hero-sub" {...rise(0.35)}>
            SVN tracks one ounce of gold. MSHARE and MBOND keep it there.
          </motion.p>
          <motion.div className="hero-actions" {...rise(0.55)}>
            <a className="btn btn-gold" href={SVN.buyUrl} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>Buy $SVN <Arrow /></a>
            <a className="btn btn-line" href="#mechanism">Watch the mechanism</a>
          </motion.div>
        </ZFade>
      </div>

      <motion.div className="hero-live" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 1, ease: [0.22, 0.8, 0.2, 1] }}>
        <div className="container hero-live-inner">
          <div className="chip">
            <span className={`dot ${price ? '' : 'off'}`} />
            Gold spot
            <strong>{price ? <CountUp value={price} format={(v) => usd(v)} duration={2.2} /> : 'Connecting'}</strong>
          </div>
          <div className="chip">
            <span className={`dot ${block ? '' : 'off'}`} />
            Robinhood Chain block
            <strong>{block ? <CountUp value={block} format={(v) => num(v)} duration={2.2} /> : 'Connecting'}</strong>
          </div>
        </div>
      </motion.div>
      <div className="scroll-cue" aria-hidden="true" />
    </section>
  );
}
