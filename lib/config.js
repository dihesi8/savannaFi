export const SITE = {
  name: 'SavannaFi',
  token: '$SVN',
};

export const SVN = {
  contractAddress: process.env.NEXT_PUBLIC_SVN_CA || '',
  buyUrl: process.env.NEXT_PUBLIC_SVN_BUY_URL || '#svn',
  // 1 SVN is designed to track 1 XAU. Change if the target changes.
  targetXauPerSvn: 1,
};

export const RESERVE_XAU = process.env.NEXT_PUBLIC_RESERVE_XAU
  ? Number(process.env.NEXT_PUBLIC_RESERVE_XAU)
  : null;

export const HERO_VIDEO =
  process.env.NEXT_PUBLIC_HERO_VIDEO ||
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260815_034306_229eccbe-fd8f-40fb-8002-9868ef2bb1a8.mp4';

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 4663);
const mainnet = chainId === 4663;

export const CHAIN = {
  name: mainnet ? 'Robinhood Chain' : 'Robinhood Chain Testnet',
  id: chainId,
  hexId: `0x${chainId.toString(16)}`,
  stack: 'Arbitrum Orbit L2',
  gasToken: 'ETH',
  explorer: process.env.NEXT_PUBLIC_EXPLORER_URL || (mainnet ? 'https://robinscan.io' : 'https://explorer.testnet.chain.robinhood.com'),
  rpc: process.env.NEXT_PUBLIC_CHAIN_RPC || (mainnet ? 'https://rpc.mainnet.chain.robinhood.com' : 'https://rpc.testnet.chain.robinhood.com'),
  docs: 'https://docs.robinhood.com/chain',
};

// Staking contract (see /contracts). Leave empty until it is deployed.
export const STAKING = {
  address: process.env.NEXT_PUBLIC_STAKING_ADDRESS || '',
  testFaucet: process.env.NEXT_PUBLIC_TEST_FAUCET === '1',
};

export const GRAMS_PER_OZ = 31.1034768;

// Milestones that unlock the vault. Reaching EITHER one triggers the XAU distribution.
// Leave empty until the team publishes them.
export const TARGETS = {
  marketCap: process.env.NEXT_PUBLIC_TARGET_MCAP ? Number(process.env.NEXT_PUBLIC_TARGET_MCAP) : null,
  volume24h: process.env.NEXT_PUBLIC_TARGET_VOLUME ? Number(process.env.NEXT_PUBLIC_TARGET_VOLUME) : null,
};
