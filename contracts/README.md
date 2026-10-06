# SavannaFi staking contracts

`SVNStaking` lets wallets stake and unstake SVN into numbered pools (pool 0 to 9, one per stock on the site).

- Unstaking is always open, even when the contract is paused or a pool is disabled.
- The owner can pause new stakes, disable a pool, set a per-pool cap and rescue tokens sent by mistake. The owner can never move staked SVN.
- Tokens that charge a transfer fee are handled: the credited amount is what the contract actually received.
- Ownership uses two steps (propose, then accept). Use a multisig as owner for mainnet.
- It holds no rewards logic. Positions are readable on chain (`stakedOf`, `userStakes`, `poolsOverview`), so a rewards contract can be added later without moving anyone's tokens.

## Commands

```bash
npm install
npm run compile      # writes ABI and bytecode to build/
npm test             # 14 tests on an in-process chain
RPC_URL=... PRIVATE_KEY=0x... npm run deploy
```

`deploy` without `SVN_TOKEN` deploys `MockSVN`, a free-to-mint test token with a `faucet()` for your team. Never use it on mainnet.
With `SVN_TOKEN=0x...` it stakes your real token. The script prints the lines to paste into the website env vars.

## Before real money

These contracts are tested but not audited. Get an independent audit, set pool caps at launch, and make a multisig the owner.
