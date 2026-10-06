import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const solc = require('solc');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));

const sources = {};
for (const dir of ['src', 'test']) {
  for (const f of walk(path.join(root, dir)).filter((x) => x.endsWith('.sol'))) {
    sources[path.relative(root, f).split(path.sep).join('/')] = { content: fs.readFileSync(f, 'utf8') };
  }
}

const input = {
  language: 'Solidity',
  sources,
  settings: {
    // "paris" keeps the bytecode free of newer opcodes, so it runs on every EVM chain.
    evmVersion: 'paris',
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
  },
};

const findImports = (p) => {
  const candidates = [path.join(root, 'node_modules', p), path.join(root, p)];
  for (const c of candidates) if (fs.existsSync(c)) return { contents: fs.readFileSync(c, 'utf8') };
  return { error: `File not found: ${p}` };
};

const out = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
const errors = (out.errors || []).filter((e) => e.severity === 'error');
for (const e of out.errors || []) console.log(e.severity === 'error' ? 'ERROR' : 'warn', e.formattedMessage.trim());
if (errors.length) process.exit(1);

fs.mkdirSync(path.join(root, 'build'), { recursive: true });
const wanted = ['SVNStaking', 'MockSVN', 'MockToken', 'MockFeeToken'];
for (const [file, contracts] of Object.entries(out.contracts)) {
  for (const [name, c] of Object.entries(contracts)) {
    if (!wanted.includes(name)) continue;
    fs.writeFileSync(path.join(root, 'build', `${name}.json`), JSON.stringify({ abi: c.abi, bytecode: `0x${c.evm.bytecode.object}` }, null, 2));
    console.log(`compiled ${name} (${file})`);
  }
}
