'use client';
import { useMemo } from 'react';
import * as THREE from 'three';

const GOLD = '#c9a24b';

function canvasTex(w, h, draw, { srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function drawCoinFace(g, s, mode, label) {
  const raised = mode === 'bump' ? '#ffffff' : '#e0c06c';
  g.fillStyle = mode === 'bump' ? '#6b6b6b' : '#c9a24b';
  g.fillRect(0, 0, s, s);
  g.translate(s / 2, s / 2);
  g.strokeStyle = raised; g.lineWidth = s * 0.012;
  g.beginPath(); g.arc(0, 0, s * 0.43, 0, Math.PI * 2); g.stroke();
  g.setLineDash([s * 0.006, s * 0.022]);
  g.beginPath(); g.arc(0, 0, s * 0.37, 0, Math.PI * 2); g.stroke();
  g.setLineDash([]);
  g.fillStyle = raised; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `700 ${s * (label.length > 3 ? 0.2 : 0.27)}px "Bodoni Moda", Georgia, serif`;
  g.fillText(label, 0, -s * 0.02);
  g.font = `600 ${s * 0.05}px "Hanken Grotesk", sans-serif`;
  g.fillText('AU  999.9', 0, s * 0.2);
}

export function Coin({ label = 'SVN', radius = 1, spin = 0, ...props }) {
  const { map, bump } = useMemo(
    () => ({
      map: canvasTex(512, 512, (g, w) => drawCoinFace(g, w, 'color', label)),
      bump: canvasTex(512, 512, (g, w) => drawCoinFace(g, w, 'bump', label), { srgb: false }),
    }),
    [label]
  );
  const h = 0.14;
  const metal = { color: GOLD, metalness: 1, roughness: 0.3, envMapIntensity: 1.5 };
  return (
    <group {...props}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius, radius, h, 96]} />
        <meshStandardMaterial {...metal} />
      </mesh>
      {[1, -1].map((side) => (
        <group key={side} rotation={[0, side === 1 ? 0 : Math.PI, 0]}>
          <mesh position={[0, 0, h / 2 + 0.002]}>
            <circleGeometry args={[radius * 0.94, 96]} />
            <meshStandardMaterial {...metal} color="#ffffff" map={map} bumpMap={bump} bumpScale={3} />
          </mesh>
          <mesh position={[0, 0, h / 2]}>
            <torusGeometry args={[radius * 0.965, radius * 0.045, 16, 96]} />
            <meshStandardMaterial {...metal} roughness={0.22} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Cast bar: trapezoid profile, bevelled, with an engraved plate on top.
export function Bar({ length = 2.4, label = 'SAVANNAFI', ...props }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.55, -0.25); s.lineTo(0.55, -0.25); s.lineTo(0.72, 0.25); s.lineTo(-0.72, 0.25); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: length, bevelEnabled: true, bevelSize: 0.045, bevelThickness: 0.05, bevelSegments: 5, curveSegments: 4 });
    g.center();
    g.rotateY(Math.PI / 2);
    return g;
  }, [length]);

  const plate = useMemo(
    () =>
      canvasTex(1024, 512, (g, w, h) => {
        g.clearRect(0, 0, w, h);
        g.fillStyle = '#6f5217'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = `700 ${h * 0.24}px "Bodoni Moda", Georgia, serif`;
        g.fillText(label, w / 2, h * 0.3);
        g.font = `600 ${h * 0.085}px "Hanken Grotesk", sans-serif`;
        g.fillText('FINE GOLD   999.9   1000 g', w / 2, h * 0.56);
        g.fillRect(w * 0.18, h * 0.7, w * 0.64, 3);
        g.font = `600 ${h * 0.065}px "Hanken Grotesk", sans-serif`;
        g.fillText('No. 0001   XAU   Robinhood Chain', w / 2, h * 0.82);
      }),
    [label]
  );

  return (
    <group {...props}>
      <mesh geometry={geo}>
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.27} envMapIntensity={1.5} />
      </mesh>
      <mesh position={[0, 0.2985, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[length * 0.78, 0.95]} />
        <meshStandardMaterial map={plate} transparent color="#ffffff" metalness={0.9} roughness={0.45} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
    </group>
  );
}
