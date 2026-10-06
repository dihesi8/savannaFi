// Server-side RPC URL. Defaults follow NEXT_PUBLIC_CHAIN_ID, override with RH_RPC_URL.
const mainnet = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 4663) === 4663;
export const RPC_URL =
  process.env.RH_RPC_URL || (mainnet ? 'https://rpc.mainnet.chain.robinhood.com' : 'https://rpc.testnet.chain.robinhood.com');
