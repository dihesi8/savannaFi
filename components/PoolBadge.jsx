// Ticker badge. Text only, no company logos.
export default function PoolBadge({ symbol }) {
  return (
    <span className="pool-badge" aria-hidden="true">
      <span>{symbol.slice(0, 4)}</span>
    </span>
  );
}
