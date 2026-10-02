'use client';
import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, Float } from '@react-three/drei';
import * as THREE from 'three';
import { Bar, Coin } from './GoldObjects';

function Rig() {
  const group = useRef();
  const ptr = useRef({ x: 0, y: 0 });
  const { viewport } = useThree();

  useEffect(() => {
    const on = (e) => { ptr.current = { x: (e.clientX / window.innerWidth) * 2 - 1, y: (e.clientY / window.innerHeight) * 2 - 1 }; };
    window.addEventListener('pointermove', on, { passive: true });
    return () => window.removeEventListener('pointermove', on);
  }, []);

  const wide = viewport.width > 9;
  const s = wide ? 1 : Math.max(0.55, viewport.width / 9);
  const x = wide ? viewport.width * 0.2 : 0;
  const y = wide ? -0.1 : -viewport.height * 0.2;

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const sy = typeof window === 'undefined' ? 0 : window.scrollY;
    const ty = -0.55 + ptr.current.x * 0.35 + sy * 0.0016;
    const tx = 0.12 + ptr.current.y * 0.18 + sy * 0.0004;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, ty, 3, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, tx, 3, dt);
    g.position.y = THREE.MathUtils.damp(g.position.y, y + sy * 0.0016, 3, dt);
  });

  return (
    <group position={[x, y, 0]} scale={s} ref={group}>
      <Bar position={[0, -0.62, -0.82]} />
      <Bar position={[0, -0.62, 0.82]} />
      <Bar position={[0.12, -0.04, 0]} />
      <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.6}>
        <Coin position={[2.05, 0.15, 1.25]} rotation={[0.1, -0.5, 0.08]} scale={0.95} />
      </Float>
      <Float speed={1.1} rotationIntensity={0.4} floatIntensity={0.8}>
        <Coin label="SVN" position={[-2.0, 1.25, 0.4]} rotation={[0.3, 0.6, -0.2]} scale={0.55} />
      </Float>
      <Float speed={1.7} rotationIntensity={0.5} floatIntensity={0.7}>
        <Coin position={[0.6, 1.85, -0.6]} rotation={[-0.4, -0.3, 0.3]} scale={0.38} />
      </Float>
    </group>
  );
}

export function Studio() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 5]} intensity={1.1} color="#fff1cf" />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={5} position={[0, 6, -4]} scale={[14, 4, 1]} />
        <Lightformer form="rect" intensity={3} position={[-6, 1, 3]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} color="#ffe9b0" />
        <Lightformer form="rect" intensity={2} position={[6, 0, 2]} rotation-y={-Math.PI / 2} scale={[8, 4, 1]} color="#cfe8d8" />
        <Lightformer form="ring" intensity={3} position={[0, -3, 4]} scale={6} />
      </Environment>
    </>
  );
}

export default function HeroScene({ active = true }) {
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0.4, 8.5], fov: 32 }} gl={{ alpha: true, antialias: true }} frameloop={active ? 'always' : 'never'}>
      <Studio />
      <Rig />
    </Canvas>
  );
}
