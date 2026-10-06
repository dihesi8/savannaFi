// Usage (testnet, with a free test token):
//   RPC_URL=... PRIVATE_KEY=0x... node scripts/deploy.mjs
// Usage (real SVN token):
//   RPC_URL=... PRIVATE_KEY=0x... SVN_TOKEN=0xYourToken node scripts/deploy.mjs
// Optional: OWNER=0x... (defaults to the deployer), POOLS=10
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Contract, ContractFactory, JsonRpcProvider, Wallet, isAddress } from 'ethers';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const art = (n) => {
  const f = path.join(root, 'build', `${n}.json`);
  if (!fs.existsSync(f)) throw new Error('Run "npm run compile" first.');
  return JSON.parse(fs.readFileSync(f, 'utf8'));
};

const { RPC_URL, PRIVATE_KEY, SVN_TOKEN, OWNER, POOLS = '10' } = process.env;
if (!RPC_URL || !PRIVATE_KEY) throw new Error('Set RPC_URL and PRIVATE_KEY.');
if (SVN_TOKEN && !isAddress(SVN_TOKEN)) throw new Error('SVN_TOKEN is not a valid address.');
if (OWNER && !isAddress(OWNER)) throw new Error('OWNER is not a valid address.');

const provider = new JsonRpcProvider(RPC_URL);
const wallet = new Wallet(PRIVATE_KEY, provider);
const net = await provider.getNetwork();
console.log(`Network chain id ${net.chainId}, deployer ${wallet.address}`);

const deploy = async (name, ...args) => {
  const a = art(name);
  const c = await new ContractFactory(a.abi, a.bytecode, wallet).deploy(...args);
  // The receipt is the source of truth for the address.
  const receipt = await c.deploymentTransaction().wait();
  const addr = receipt.contractAddress;
  console.log(`${name} deployed at ${addr}`);
  return addr;
};

let token = SVN_TOKEN;
let testFaucet = false;
if (!token) {
  console.log('No SVN_TOKEN given: deploying the free-to-mint MockSVN for testing.');
  token = await deploy('MockSVN');
  testFaucet = true;
}
const staking = await deploy('SVNStaking', token, Number(POOLS), OWNER || wallet.address);

// Self-check: the staking contract must report the token we gave it.
const check = new Contract(staking, art('SVNStaking').abi, provider);
const reported = await check.stakingToken();
if (reported.toLowerCase() !== token.toLowerCase()) throw new Error(`Staking token mismatch: ${reported} vs ${token}`);
console.log(`Verified: ${staking} stakes ${reported}`);

console.log('\nAdd these to the website .env.local (or Vercel env vars):');
console.log(`NEXT_PUBLIC_STAKING_ADDRESS=${staking}`);
console.log(`NEXT_PUBLIC_CHAIN_ID=${net.chainId}`);
if (testFaucet) console.log('NEXT_PUBLIC_TEST_FAUCET=1');
