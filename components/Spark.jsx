export default function Spark({ data, up = true, w = 96, h = 32 }) {
  if (!data || data.length < 2) return <span className="spark-empty" aria-hidden="true" />;
  const lo = Math.min(...data), hi = Math.max(...data);
  const span = hi - lo || 1;
  const pts = data.map((v, i) => `${((i / (data.length - 1)) * w).toFixed(1)},${(h - 3 - ((v - lo) / span) * (h - 6)).toFixed(1)}`);
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
      <polyline points={pts.join(' ')} fill="none" stroke={up ? '#e4c777' : 'rgba(236,230,210,0.6)'} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
