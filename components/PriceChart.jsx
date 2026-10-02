'use client';
import { useMemo, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const W = 700, H = 240, PAD = 18;

function smooth(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` C${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`;
  }
  return d;
}

export default function PriceChart({ samples }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  const geo = useMemo(() => {
    if (samples.length < 2) return null;
    const ps = samples.map((s) => s.p);
    let lo = Math.min(...ps), hi = Math.max(...ps);
    if (hi - lo < lo * 0.0004) { const m = lo * 0.0004; lo -= m; hi += m; }
    const pts = samples.map((s, i) => [
      PAD + (i / (samples.length - 1)) * (W - PAD * 2),
      H - PAD - ((s.p - lo) / (hi - lo)) * (H - PAD * 2),
    ]);
    const line = smooth(pts);
    const last = pts[pts.length - 1];
    return { line, area: `${line} L${last[0]} ${H} L${pts[0][0]} ${H} Z`, last, lo, hi };
  }, [samples]);

  return (
    <div className="chart" ref={ref}>
      {!geo && <div className="chart-empty">Collecting live samples</div>}
      {geo && (
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Live XAU price over this session">
          <defs>
            <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#c9a24b" stopOpacity="0.28" />
              <stop offset="1" stopColor="#c9a24b" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="rgba(201,162,75,0.14)" strokeDasharray="3 7" vectorEffect="non-scaling-stroke" />
          ))}
          <path d={geo.area} fill="url(#area)" />
          <motion.path d={geo.line} fill="none" stroke="#e4c777" strokeWidth="2.4" strokeLinecap="round" vectorEffect="non-scaling-stroke" initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}} transition={{ duration: 1.8, ease: [0.22, 0.8, 0.2, 1] }} />
        </svg>
      )}
      {geo && (
        <span
          className="dot"
          style={{ position: 'absolute', left: `${(geo.last[0] / W) * 100}%`, top: `${(geo.last[1] / H) * 100}%`, transform: 'translate(-50%, -50%)' }}
        />
      )}
    </div>
  );
}
