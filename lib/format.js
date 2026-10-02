export const usd = (n, d = 2) =>
  `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;

export const num = (n, d = 0) =>
  Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

export const ratio = (n) => {
  if (n === 0) return '0';
  if (n >= 0.01) return n.toFixed(4);
  return n.toPrecision(3);
};
