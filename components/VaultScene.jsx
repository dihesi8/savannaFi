'use client';
import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Bar } from './GoldObjects';
import { Studio } from './HeroScene';

// Six bars in a pyramid, turning slowly. Pulses briefly each time the live price changes.
function Pyramid({ pulse }) {
  const g = useRef();
  const last = useRef(pulse);
  const kick = useRef(0);
  useFrame((_, dt) => {
    if (!g.current) return;
    if (pulse !== last.current) { last.current = pulse; kick.current = 1; }
    kick.current = THREE.MathUtils.damp(kick.current, 0, 4, dt);
    g.current.rotation.y += dt * 0.28;
    const s = 1 + kick.current * 0.045;
    g.current.scale.setScalar(s * 0.8);
  });
  const L = 1.8;
  return (
    <group ref={g} rotation={[0.18, 0.5, 0]} position={[0, -0.1, 0]}>
      {[-1.15, 0, 1.15].map((z) => <Bar key={z} length={L} label="SVN" position={[0, -0.62, z]} />)}
      {[-0.58, 0.58].map((z) => <Bar key={z} length={L} label="SVN" position={[0, -0.04, z]} />)}
      <Bar length={L} label="SVN" position={[0, 0.54, 0]} />
    </group>
  );
}

export default function VaultScene({ active = true, pulse = 0 }) {
  return (
    <Canvas dpr={[1, 1.6]} camera={{ position: [0, 1.2, 8], fov: 30 }} gl={{ alpha: true, antialias: true }} frameloop={active ? 'always' : 'never'}>
      <Studio />
      <Pyramid pulse={pulse} />
    </Canvas>
  );
}
