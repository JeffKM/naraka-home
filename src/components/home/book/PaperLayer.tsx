"use client";

import { useTexture } from "@react-three/drei";
import { Suspense } from "react";
import { DoubleSide, SRGBColorSpace, type Texture } from "three";
import type { PaperLayerDef } from "@/lib/homeBook";

// 판 하나 — 경첩을 축으로 눕힘(open 0)→세움(open 1). 조명 없음(MeshBasicMaterial).
function TexturedPlane({ src, w, h }: { src: string; w: number; h: number }) {
  const tex = useTexture(src, (t: Texture) => {
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 4;
  });
  return (
    <mesh position={[0, h / 2, 0]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} transparent alphaTest={0.02} side={DoubleSide} toneMapped={false} />
    </mesh>
  );
}

function TintPlane({ w, h, tint }: { w: number; h: number; tint: string }) {
  return (
    <mesh position={[0, h / 2, 0]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial color={tint} side={DoubleSide} toneMapped={false} />
    </mesh>
  );
}

export function PaperLayer({ def, open }: { def: PaperLayerDef; open: number }) {
  // bottom 경첩: x축 회전, 눕힘은 뒤쪽(-90°). left/right: y축 회전.
  const angle = (1 - open) * (Math.PI / 2);
  const rotation: [number, number, number] =
    def.hinge === "bottom" ? [-angle, 0, 0] : def.hinge === "left" ? [0, angle, 0] : [0, -angle, 0];
  const pivotX = def.hinge === "left" ? -def.w / 2 : def.hinge === "right" ? def.w / 2 : 0;
  return (
    <group position={[def.x, def.y, def.z]}>
      <group position={[pivotX, 0, 0]} rotation={rotation}>
        <group position={[-pivotX, 0, 0]}>
          {def.src ? (
            <Suspense fallback={<TintPlane w={def.w} h={def.h} tint={def.tint ?? "#6b4a44"} />}>
              <TexturedPlane src={def.src} w={def.w} h={def.h} />
            </Suspense>
          ) : (
            <TintPlane w={def.w} h={def.h} tint={def.tint ?? "#6b4a44"} />
          )}
        </group>
      </group>
    </group>
  );
}
