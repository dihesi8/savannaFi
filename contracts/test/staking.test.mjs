import { test, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { BrowserProvider, ContractFactory, Contract, parseEther } from 'ethers';

const require = createRequire(import.meta.url);
const ganache = require('ganache');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const art = (n) => JSON.parse(fs.readFileSync(path.join(root, 'build', `${n}.json`), 'utf8'));

let provider, owner, alice, bob, mallory, token, staking;
const E = (n) => parseEther(String(n));

async function deploy(name, ...args) {
  const a = art(name);
  const c = await new ContractFactory(a.abi, a.bytecode, owner).deploy(...args);
  await c.waitForDeployment();
  return c;
}
const as = (c, signer) => c.connect(signer);
const reverts = (p, name) => assert.rejects(p, (e) => (name ? String(e.message + (e.revert?.name || '')).includes(name) : true));
// Calls a method with staticCall so the custom error name is decoded.
const rv = (c, signer, method, args, name) =>
  assert.rejects(as(c, signer)[method].staticCall(...args), (e) => String((e.revert && e.revert.name) || '') === name || String(e.message).includes(name));

before(async () => {
  provider = new BrowserProvider(ganache.provider({ logging: { quiet: true }, wallet: { deterministic: true }, chain: { hardfork: 'shanghai' } }));
  [owner, alice, bob, mallory] = await Promise.all([0, 1, 2, 3].map((i) => provider.getSigner(i)));
});

beforeEach(async () => {
  token = await deploy('MockToken');
  staking = await deploy('SVNStaking', await token.getAddress(), 10, await owner.getAddress());
  for (const s of [alice, bob]) {
    await (await token.mint(await s.getAddress(), E(1000))).wait();
    await (await as(token, s).approve(await staking.getAddress(), E(1000))).wait();
  }
});

test('stake moves tokens and updates pool and user totals', async () => {
  await (await as(staking, alice).stake(0, E(100))).wait();
  assert.equal(await staking.stakedOf(0, await alice.getAddress()), E(100));
  assert.equal(await staking.totalStaked(0), E(100));
  assert.equal(await token.balanceOf(await staking.getAddress()), E(100));
  assert.equal(await token.balanceOf(await alice.getAddress()), E(900));
  const [, , totals, stakers] = await staking.poolsOverview();
  assert.equal(totals[0], E(100));
  assert.equal(stakers[0], 1n);
  assert.equal(totals[1], 0n);
});

test('positions are separate per pool and per wallet', async () => {
  await (await as(staking, alice).stake(0, E(10))).wait();
  await (await as(staking, alice).stake(3, E(20))).wait();
  await (await as(staking, bob).stake(3, E(5))).wait();
  const mine = await staking.userStakes(await alice.getAddress());
  assert.equal(mine[0], E(10));
  assert.equal(mine[3], E(20));
  assert.equal(await staking.totalStaked(3), E(25));
  assert.equal(await staking.totalStakedAll(), E(35));
  const info = await staking.poolInfo(3);
  assert.equal(info.stakers, 2n);
});

test('partial and full unstake return tokens and keep staker count right', async () => {
  const a = await alice.getAddress();
  await (await as(staking, alice).stake(2, E(100))).wait();
  await (await as(staking, alice).unstake(2, E(40))).wait();
  assert.equal(await staking.stakedOf(2, a), E(60));
  assert.equal((await staking.poolInfo(2)).stakers, 1n);
  await (await as(staking, alice).unstakeAll(2)).wait();
  assert.equal(await staking.stakedOf(2, a), 0n);
  assert.equal((await staking.poolInfo(2)).stakers, 0n);
  assert.equal(await token.balanceOf(a), E(1000));
  assert.equal(await token.balanceOf(await staking.getAddress()), 0n);
});

test('re-staking after a full exit counts the staker again', async () => {
  await (await as(staking, alice).stake(1, E(10))).wait();
  await (await as(staking, alice).unstakeAll(1)).wait();
  await (await as(staking, alice).stake(1, E(10))).wait();
  assert.equal((await staking.poolInfo(1)).stakers, 1n);
});

test('rejects zero amounts, over-unstake, and invalid pools', async () => {
  await rv(staking, alice, 'stake', [0, 0n], 'ZeroAmount');
  await rv(staking, alice, 'unstake', [0, E(1)], 'InsufficientStake');
  await rv(staking, alice, 'unstakeAll', [0], 'ZeroAmount');
  await rv(staking, alice, 'stake', [10, E(1)], 'InvalidPool');
  await (await as(staking, alice).stake(0, E(5))).wait();
  await rv(staking, bob, 'unstake', [0, E(1)], 'InsufficientStake');
  await rv(staking, alice, 'unstake', [0, E(6)], 'InsufficientStake');
});

test('cannot stake without allowance or balance', async () => {
  await reverts(as(staking, mallory).stake(0, E(1)));
});

test('pool cap blocks stakes above the cap', async () => {
  await (await staking.setPoolCap(0, E(150))).wait();
  await (await as(staking, alice).stake(0, E(100))).wait();
  await rv(staking, bob, 'stake', [0, E(51)], 'CapExceeded');
  await (await as(staking, bob).stake(0, E(50))).wait();
  assert.equal(await staking.totalStaked(0), E(150));
  await (await staking.setPoolCap(0, 0)).wait();
  await (await as(staking, bob).stake(0, E(10))).wait();
});

test('disabled pool blocks new stakes but allows unstake', async () => {
  await (await as(staking, alice).stake(4, E(10))).wait();
  await (await staking.setPoolEnabled(4, false)).wait();
  await rv(staking, bob, 'stake', [4, E(1)], 'PoolDisabled');
  await (await as(staking, alice).unstakeAll(4)).wait();
  assert.equal(await token.balanceOf(await alice.getAddress()), E(1000));
});

test('pause blocks stake but never unstake', async () => {
  await (await as(staking, alice).stake(0, E(10))).wait();
  await (await staking.pause()).wait();
  await rv(staking, bob, 'stake', [0, E(1)], 'EnforcedPause');
  await (await as(staking, alice).unstake(0, E(10))).wait();
  await (await staking.unpause()).wait();
  await (await as(staking, bob).stake(0, E(1))).wait();
});

test('only the owner can configure', async () => {
  await rv(staking, mallory, 'setPoolCap', [0, 1n], 'OwnableUnauthorizedAccount');
  await rv(staking, mallory, 'setPoolEnabled', [0, false], 'OwnableUnauthorizedAccount');
  await rv(staking, mallory, 'pause', [], 'OwnableUnauthorizedAccount');
  await rv(staking, mallory, 'rescueToken', [await token.getAddress(), await mallory.getAddress(), 1n], 'OwnableUnauthorizedAccount');
});

test('rescue works for other tokens but never for staked SVN', async () => {
  const stray = await deploy('MockToken');
  await (await stray.mint(await staking.getAddress(), E(7))).wait();
  await (await staking.rescueToken(await stray.getAddress(), await owner.getAddress(), E(7))).wait();
  assert.equal(await stray.balanceOf(await owner.getAddress()), E(7));
  await (await as(staking, alice).stake(0, E(10))).wait();
  await rv(staking, owner, 'rescueToken', [await token.getAddress(), await owner.getAddress(), E(10)], 'CannotRescueStakingToken');
});

test('ownership transfer is two step', async () => {
  await (await staking.transferOwnership(await alice.getAddress())).wait();
  assert.equal(await staking.owner(), await owner.getAddress());
  await (await as(staking, alice).acceptOwnership()).wait();
  assert.equal(await staking.owner(), await alice.getAddress());
});

test('fee-on-transfer tokens are credited by amount received', async () => {
  const fee = await deploy('MockFeeToken');
  const s = await deploy('SVNStaking', await fee.getAddress(), 10, await owner.getAddress());
  const a = await alice.getAddress();
  await (await fee.mint(a, E(1000))).wait();
  await (await as(fee, alice).approve(await s.getAddress(), E(1000))).wait();
  await (await as(s, alice).stake(0, E(100))).wait();
  assert.equal(await s.stakedOf(0, a), E(99)); // 1% fee burned in transit
  assert.equal(await s.totalStaked(0), E(99));
  await (await as(s, alice).unstakeAll(0)).wait(); // contract can always pay out what it credited
  assert.equal(await s.totalStaked(0), 0n);
});

test('constructor validates inputs and exposes the staking token', async () => {
  const addr = await token.getAddress();
  assert.equal(await staking.stakingToken(), addr);
  assert.equal(await staking.poolCount(), 10n);
  await reverts(deploy('SVNStaking', '0x0000000000000000000000000000000000000000', 10, await owner.getAddress()));
  await reverts(deploy('SVNStaking', addr, 0, await owner.getAddress()));
  await reverts(deploy('SVNStaking', addr, 65, await owner.getAddress()));
});
