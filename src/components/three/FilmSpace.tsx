"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { MathUtils, SRGBColorSpace, TextureLoader } from "three";

function FilmScreen({ url, index, active, onSelect }: { url: string; index: number; active: boolean; onSelect: () => void }) {
  const texture = useLoader(TextureLoader, url);
  const map = useMemo(() => { const clone = texture.clone(); clone.colorSpace = SRGBColorSpace; clone.needsUpdate = true; return clone; }, [texture]);
  useEffect(() => () => map.dispose(), [map]);
  return <group position={[index * 5.15, 0, 0]} rotation={[0, index % 2 ? -.055 : .055, 0]}>
    <mesh position={[0, 0, -.05]}><boxGeometry args={[4.46, 2.53, .08]} /><meshStandardMaterial color={active ? "#b60823" : "#242026"} roughness={.32} metalness={.65} /></mesh>
    <mesh onClick={onSelect} onPointerOver={() => { document.body.style.cursor = "pointer"; }} onPointerOut={() => { document.body.style.cursor = ""; }}><planeGeometry args={[4.42, 2.49]} /><meshBasicMaterial map={map} toneMapped={false} /></mesh>
  </group>;
}

function CameraRig({ progress, count, ready }: { progress: number; count: number; ready: () => void }) {
  const { invalidate } = useThree();
  const last = useRef(-1);
  useEffect(() => { invalidate(); }, [progress, invalidate]);
  useEffect(() => { ready(); }, [ready]);
  useFrame(({ camera }) => {
    const target = progress * (count - 1) * 5.15;
    camera.position.x = MathUtils.lerp(camera.position.x, target, .14);
    camera.position.y = MathUtils.lerp(camera.position.y, .14 * Math.sin(progress * Math.PI * 2), .1);
    camera.position.z = 4.95 + .5 * Math.sin(progress * Math.PI);
    camera.lookAt(camera.position.x + (target - camera.position.x) * .15, 0, 0);
    if (Math.abs(camera.position.x - target) > .002 || last.current !== progress) { invalidate(); last.current = progress; }
  });
  return null;
}

export default function FilmSpace({ images, progress, onSelect, onReady }: { images: string[]; progress: number; onSelect: (index: number) => void; onReady: () => void }) {
  return <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ fov: 36, position: [0, .1, 4.95], near: .1, far: 80 }} gl={{ alpha: true, antialias: true, powerPreference: "low-power" }} fallback={null}>
    <ambientLight intensity={1.4} /><directionalLight position={[2, 4, 5]} intensity={3} />
    <Suspense fallback={null}>{images.map((url, i) => <FilmScreen key={url + i} url={url} index={i} active={Math.round(progress * (images.length - 1)) === i} onSelect={() => onSelect(i)} />)}<CameraRig progress={progress} count={images.length} ready={onReady} /></Suspense>
  </Canvas>;
}
