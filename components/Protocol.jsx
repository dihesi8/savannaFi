'use client';
import ZFade from './ZFade';
import Tilt from './Tilt';
import { CoinFace } from './Art';

const TOKENS = [
  { id: 'svn', label: 'SVN', sub: 'AU 999.9', name: 'SVN', line: 'The core asset. Built to track the price of one ounce of gold.', tag: 'Core asset', main: true },
  { id: 'mshare', label: 'MS', sub: 'SHARE', name: 'MSHARE', line: 'Takes the expansion when SVN trades above its gold target.', tag: 'Expansion' },
  { id: 'mbond', label: 'MB', sub: 'BOND', name: 'MBOND', line: 'Absorbs the contraction when SVN trades below its gold target.', tag: 'Contraction' },
];

export default function Protocol() {
  return (
    <section className="section" id="protocol">
      <div className="container">
        <ZFade className="section-head">
          <h2>Three assets. One living system.</h2>
        </ZFade>
        <div className="cards stage-3d">
          {TOKENS.map((t) => (
            <ZFade key={t.id} depth={380}>
              <Tilt>
                <article className={`card ${t.main ? 'card-main' : ''}`}>
                  <CoinFace id={`p-${t.id}`} label={t.label} sub={t.sub} className="card-coin" />
                  <h3>{t.name}</h3>
                  <p>{t.line}</p>
                  <span className="card-tag">{t.tag}</span>
                </article>
              </Tilt>
            </ZFade>
          ))}
        </div>
      </div>
    </section>
  );
}
