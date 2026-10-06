'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { HERO_VIDEO } from '@/lib/config';

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const vh = () => (typeof window === 'undefined' ? 800 : window.innerHeight);

// One fixed video. Sharp in the hero, then it blurs and darkens as the page scrolls.
export default function Background() {
  const { scrollY } = useScroll();
  const home = usePathname() === '/';
  const blur = useTransform(scrollY, (v) => `blur(${((home ? clamp01(v / (vh() * 0.85)) : 1) * 28).toFixed(1)}px)`);
  const shade = useTransform(scrollY, (v) => 0.3 + (home ? clamp01(v / (vh() * 0.85)) : 1) * 0.46);

  return (
    <div className="bg-stage" aria-hidden="true">
      <motion.video
        className="bg-video"
        src={HERO_VIDEO}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        style={{ filter: blur }}
      />
      <div className="bg-tint" />
      <motion.div className="bg-shade" style={{ opacity: shade }} />
    </div>
  );
}
