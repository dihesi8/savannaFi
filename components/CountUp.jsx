'use client';
import { useEffect, useRef } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

// Counts from 0 to the value the first time it scrolls into view, then eases between live updates.
export default function CountUp({ value, format = (v) => v.toFixed(0), duration = 1.8, className = '' }) {
  const ref = useRef(null);
  const fmt = useRef(format);
  const shown = useRef(0);
  const started = useRef(false);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const reduce = useReducedMotion();
  fmt.current = format;

  useEffect(() => {
    if (!inView || value == null || !Number.isFinite(value)) return;
    const from = started.current ? shown.current : 0;
    const controls = animate(from, value, {
      duration: reduce ? 0 : started.current ? 0.9 : duration,
      ease: [0.22, 0.8, 0.2, 1],
      onUpdate: (v) => {
        shown.current = v;
        if (ref.current) ref.current.textContent = fmt.current(v);
      },
    });
    started.current = true;
    return () => controls.stop();
  }, [value, inView, duration, reduce]);

  return <span ref={ref} className={`num ${className}`}>{format(0)}</span>;
}
