'use client';
import { Diamond } from './Art';
import { useLiveData } from './LiveProvider';
import { usd } from '@/lib/format';

const ITEMS = [
  'SVN tracks one ounce of gold',
  'Expansion through MSHARE',
  'Contraction through MBOND',
  'Live on Robinhood Chain',
  'Arbitrum Orbit security',
  'Gas paid in ETH',
];

export default function Marquee() {
  const { gold } = useLiveData();
  const price = gold.data?.price;
  const items = price ? [`XAU/USD ${usd(price)}`, ...ITEMS] : ITEMS;

  // Two identical groups; the track moves exactly one group width, so the loop has no seam.
  const group = (k) => (
    <div className="marquee-group" key={k} aria-hidden={k === 'b'}>
      {[...items, ...items].map((t, i) => (
        <span className="marquee-item" key={`${t}-${i}`}>{t}<Diamond /></span>
      ))}
    </div>
  );
  return (
    <section className="marquee" aria-label="Protocol highlights">
      <div className="marquee-track">{group('a')}{group('b')}</div>
    </section>
  );
}
