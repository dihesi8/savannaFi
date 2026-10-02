'use client';
import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

// Recedes along the Z axis as it scrolls out of view: it shrinks, fades and softens.
export default function ZFade({ children, className = '', as = 'div', depth = 520, enter = true }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });

  const inStart = enter ? 0.0 : 0.14;
  const opacity = useTransform(scrollYProgress, [0, 0.16, 0.56, 0.92], [enter ? 0 : 1, 1, 1, 0]);
  const z = useTransform(scrollYProgress, [0, 0.16, 0.56, 1], [enter ? -140 : 0, 0, 0, -depth]);
  const blur = useTransform(scrollYProgress, [0, 0.16, 0.6, 0.95], [enter ? 6 : 0, 0, 0, 7]);
  const filter = useTransform(blur, (b) => (b < 0.2 ? 'none' : `blur(${b.toFixed(1)}px)`));
  const Tag = motion[as] || motion.div;

  if (reduce) return <div ref={ref} className={className}>{children}</div>;
  return (
    <Tag ref={ref} className={`zfade ${className}`} style={{ opacity, z, filter, transformPerspective: 1100 }}>
      {children}
    </Tag>
  );
}
