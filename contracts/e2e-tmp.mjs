import fs from 'node:fs';
import { createRequire } from 'node:module';
const { createPublicClient, http, defineChain } = createRequire('/home/claude/savannafi/package.json')('viem');
import { Wallet, JsonRpcProvider, Contract, parseEther, NonceManager } from 'ethers';
const src = fs.readFileSync('/home/claude/savannafi/lib/stakingAbi.js','utf8');
fs.writeFileSync('/tmp/abi.mjs', src);
const { stakingAbi, erc20Abi } = await import('/tmp/abi.mjs');
const [staking, token] = [process.env.STAKING, process.env.TOKEN];
const chain = defineChain({ id: 46630, name: 't', nativeCurrency:{name:'E',symbol:'ETH',decimals:18}, rpcUrls:{default:{http:['http://x']}} });
const client = createPublicClient({ chain, transport: http('http://127.0.0.1:3113/api/rpc') });
const me = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1';
const read = (fn, args) => client.readContract({ address: staking, abi: stakingAbi, functionName: fn, args });
console.log('stakingToken via proxy:', (await read('stakingToken')).toLowerCase() === token.toLowerCase());
console.log('paused:', await read('paused'), 'poolCount:', await read('poolCount'));
let ov = await read('poolsOverview');
console.log('pools:', ov[0].length, 'enabled all:', ov[0].every(Boolean), 'totals all zero:', ov[2].every((x)=>x===0n));
console.log('decimals/symbol:', await client.readContract({address:token,abi:erc20Abi,functionName:'decimals'}), await client.readContract({address:token,abi:erc20Abi,functionName:'symbol'}));

// act as a user: faucet, approve, stake into pool 3
const w = new NonceManager(new Wallet(process.env.PRIVATE_KEY, new JsonRpcProvider('http://127.0.0.1:8545')));
const t = new Contract(token, erc20Abi, w), s = new Contract(staking, stakingAbi, w);
await (await t.faucet()).wait();
console.log('balance after faucet via proxy:', await client.readContract({address:token,abi:erc20Abi,functionName:'balanceOf',args:[me]}));
await (await t.approve(staking, parseEther('500'))).wait();
console.log('allowance via proxy:', await client.readContract({address:token,abi:erc20Abi,functionName:'allowance',args:[me, staking]}));
await (await s.stake(3, parseEther('500'))).wait();
ov = await read('poolsOverview');
const mine = await read('userStakes', [me]);
console.log('pool 3 total/stakers:', ov[2][3], ov[3][3], '| my pool 3 stake:', mine[3]);
await (await s.unstakeAll(3)).wait();
console.log('after unstakeAll total:', (await read('totalStaked', [3])), 'balance back:', await client.readContract({address:token,abi:erc20Abi,functionName:'balanceOf',args:[me]}));
// proxy must reject non-read methods
const bad = await fetch('http://127.0.0.1:3113/api/rpc',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_sendRawTransaction',params:['0x00']})});
console.log('proxy blocks eth_sendRawTransaction:', bad.status);
