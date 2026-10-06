export const usd = (n, d = 2) =>
  `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;

export const num = (n, d = 0) =>
  Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

export const ratio = (n) => {
  if (n === 0) return '0';
  if (n >= 0.01) return n.toFixed(4);
  return n.toPrecision(3);
};

export const compactUsd = (n) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

export const short = (a) => (a ? `${a.slice(0, 6)}...${a.slice(-4)}` : '');
