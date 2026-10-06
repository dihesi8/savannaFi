// Ten stock pools. The array index is the pool id inside the staking contract.
// Stock prices come live from /api/stocks. Never reorder this list after the contract is deployed.
export const POOLS = [
  { id: 'tsla', symbol: 'TSLA', name: 'Tesla' },
  { id: 'nvda', symbol: 'NVDA', name: 'NVIDIA' },
  { id: 'aapl', symbol: 'AAPL', name: 'Apple' },
  { id: 'amzn', symbol: 'AMZN', name: 'Amazon' },
  { id: 'msft', symbol: 'MSFT', name: 'Microsoft' },
  { id: 'googl', symbol: 'GOOGL', name: 'Alphabet' },
  { id: 'meta', symbol: 'META', name: 'Meta Platforms' },
  { id: 'nflx', symbol: 'NFLX', name: 'Netflix' },
  { id: 'amd', symbol: 'AMD', name: 'AMD' },
  { id: 'pltr', symbol: 'PLTR', name: 'Palantir' },
];

export const SYMBOLS = POOLS.map((p) => p.symbol);
