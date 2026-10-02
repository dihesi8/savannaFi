'use client';
import { useRef } from 'react';
import dynamic from 'next/dynamic';
import { useInView } from 'framer-motion';

const Hero = dynamic(() => import('./HeroScene'), { ssr: false });
const Vault = dynamic(() => import('./VaultScene'), { ssr: false });

// Mounts a 3D scene on the client and pauses rendering while it is off screen.
export default function SceneFrame({ kind, className = '', ...rest }) {
  const ref = useRef(null);
  const inView = useInView(ref, { margin: '120px 0px 120px 0px' });
  const Scene = kind === 'vault' ? Vault : Hero;
  return (
    <div ref={ref} className={className} aria-hidden="true">
      <Scene active={inView} {...rest} />
    </div>
  );
}
