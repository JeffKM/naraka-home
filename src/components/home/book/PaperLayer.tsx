"use client";

import { useTexture } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import { CanvasTexture, DoubleSide, SRGBColorSpace, type Texture } from "three";
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

/* ───────── 라벨 와이어프레임 판 (에셋 전 구조 확인용) ───────── */

type LabelKind = "plain" | "sky" | "frame" | "figure";

const FONT = '"Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", system-ui, sans-serif';
/** 캔버스 긴 변 픽셀 */
const LONG_SIDE = 512;

type Rgb = [number, number, number];

function toRgb(hex: string): Rgb {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return [107, 74, 68];
  const n = Number.parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** rgb를 target(0=검정, 255=흰색) 쪽으로 amount만큼 섞는다 */
function mixTo(c: Rgb, target: number, amount: number): Rgb {
  return [
    Math.round(c[0] + (target - c[0]) * amount),
    Math.round(c[1] + (target - c[1]) * amount),
    Math.round(c[2] + (target - c[2]) * amount),
  ];
}

const css = (c: Rgb): string => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
const cssA = (c: Rgb, a: number): string => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;

/** 상대 휘도 근사 — 글자색을 밝게 쓸지 어둡게 쓸지 고르는 데만 쓴다 */
function luminance(c: Rgb): number {
  return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
}

/** 주어진 폭에 들어갈 때까지 글자 크기를 줄인다 */
function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startPx: number,
  weight = 700
): void {
  let px = startPx;
  ctx.font = `${weight} ${px}px ${FONT}`;
  while (px > 9 && ctx.measureText(text).width > maxWidth) {
    px -= 2;
    ctx.font = `${weight} ${px}px ${FONT}`;
  }
}

/** 모서리 둥근 사각형 경로 (roundRect 미지원 대비 수동 작성) */
function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

/** 종이 바탕 + 테두리 6px + 안쪽 밝은 선 2px */
function drawPaper(ctx: CanvasRenderingContext2D, cw: number, ch: number, tint: Rgb): Rgb {
  const fill = mixTo(tint, 255, 0.25);
  ctx.fillStyle = css(fill);
  ctx.fillRect(0, 0, cw, ch);
  // 안쪽 종이 결 — 바탕보다 살짝 밝은 선
  ctx.strokeStyle = css(mixTo(fill, 255, 0.3));
  ctx.lineWidth = 2;
  ctx.strokeRect(11, 11, cw - 22, ch - 22);
  // 바깥 테두리 — 바탕보다 어둡게
  ctx.strokeStyle = css(mixTo(tint, 0, 0.35));
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, cw - 6, ch - 6);
  return fill;
}

/** 글자색 한 쌍 (본문/보조) */
function inkOf(fill: Rgb): { ink: string; muted: string } {
  const dark = luminance(fill) > 0.55;
  const base: Rgb = dark ? [24, 22, 28] : [240, 234, 222];
  return { ink: css(base), muted: cssA(base, 0.62) };
}

function drawPlain(ctx: CanvasRenderingContext2D, cw: number, ch: number, tint: Rgb, label: string, id: string): void {
  const fill = drawPaper(ctx, cw, ch, tint);
  const { ink, muted } = inkOf(fill);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = ink;
  fitFont(ctx, label, cw * 0.86, 58);
  ctx.fillText(label, cw / 2, ch / 2 - 16);
  ctx.fillStyle = muted;
  fitFont(ctx, id, cw * 0.86, 26, 400);
  ctx.fillText(id, cw / 2, ch / 2 + 30);
}

function drawFigure(ctx: CanvasRenderingContext2D, cw: number, ch: number, tint: Rgb, label: string, id: string): void {
  const fill = drawPaper(ctx, cw, ch, tint);
  const { ink, muted } = inkOf(fill);
  // 인물 실루엣 — 원화 컷아웃이 들어갈 자리.
  // 판 아래쪽 1/4은 앞의 문틀 띠에 가려지므로 실루엣·라벨을 모두 위쪽에 몰아 둔다.
  const silhouette = css(mixTo(tint, 0, 0.55));
  const cx = cw / 2;
  const headR = Math.min(cw, ch) * 0.085;
  const headY = ch * 0.1 + headR;
  const bodyW = headR * 3;
  const bodyTop = headY + headR * 1.05;
  const bodyH = Math.max(headR, ch * 0.58 - bodyTop);
  ctx.fillStyle = silhouette;
  ctx.beginPath();
  ctx.arc(cx, headY, headR, 0, Math.PI * 2);
  ctx.fill();
  roundedRectPath(ctx, cx - bodyW / 2, bodyTop, bodyW, bodyH, bodyW * 0.36);
  ctx.fill();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = ink;
  fitFont(ctx, label, cw * 0.88, 46);
  ctx.fillText(label, cx, ch * 0.65);
  ctx.fillStyle = muted;
  fitFont(ctx, id, cw * 0.88, 24, 400);
  ctx.fillText(id, cx, ch * 0.73);
}

function drawSky(ctx: CanvasRenderingContext2D, cw: number, ch: number, label: string, id: string): void {
  // 허공과 구분되도록 완전 검정 대신 살짝 띄운 남빛
  ctx.fillStyle = "#17151d";
  ctx.fillRect(0, 0, cw, ch);
  // 별 — 위치는 고정값(결정적)
  const stars = [
    [0.08, 0.18], [0.17, 0.42], [0.26, 0.12], [0.34, 0.31], [0.43, 0.2],
    [0.52, 0.4], [0.61, 0.15], [0.7, 0.33], [0.79, 0.22], [0.88, 0.38],
    [0.13, 0.63], [0.38, 0.72], [0.66, 0.68], [0.92, 0.6],
  ];
  ctx.fillStyle = "rgba(236, 232, 219, 0.75)";
  for (const [fx, fy] of stars) {
    ctx.beginPath();
    ctx.arc(fx * cw, fy * ch, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(236, 232, 219, 0.16)";
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, cw - 3, ch - 3);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(240, 234, 222, 0.92)";
  fitFont(ctx, label, cw * 0.6, 32);
  ctx.fillText(label, 20, ch - 38);
  ctx.fillStyle = "rgba(240, 234, 222, 0.55)";
  fitFont(ctx, id, cw * 0.6, 20, 400);
  ctx.fillText(id, 20, ch - 14);
}

function drawFrame(ctx: CanvasRenderingContext2D, cw: number, ch: number, tint: Rgb, label: string, id: string): void {
  // 가운데는 완전 투명 — 카메라가 방 안을 들여다볼 수 있어야 한다
  ctx.clearRect(0, 0, cw, ch);
  const band = Math.round(Math.min(cw, ch) * 0.14);
  const fill = mixTo(tint, 255, 0.25);
  ctx.fillStyle = css(fill);
  ctx.fillRect(0, 0, cw, band);
  ctx.fillRect(0, ch - band, cw, band);
  ctx.fillRect(0, band, band, ch - band * 2);
  ctx.fillRect(cw - band, band, band, ch - band * 2);
  const edge = css(mixTo(tint, 0, 0.35));
  ctx.strokeStyle = edge;
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, cw - 6, ch - 6);
  ctx.lineWidth = 4;
  ctx.strokeRect(band, band, cw - band * 2, ch - band * 2);
  const { ink, muted } = inkOf(fill);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = ink;
  fitFont(ctx, label, cw - band * 2.4, Math.min(58, band * 0.72));
  ctx.fillText(label, cw / 2, band / 2);
  ctx.fillStyle = muted;
  fitFont(ctx, id, cw - band * 2.4, Math.min(26, band * 0.46), 400);
  ctx.fillText(id, cw / 2, ch - band / 2);
}

// 라벨 텍스처 캐시 — label+tint+kind+캔버스 크기가 같으면 캔버스를 다시 만들지 않는다
const labelTextureCache = new Map<string, CanvasTexture>();

function makeLabelTexture(
  kind: LabelKind,
  label: string,
  id: string,
  tintHex: string,
  w: number,
  h: number
): CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const aspect = w / h;
  const cw = aspect >= 1 ? LONG_SIDE : Math.max(64, Math.round(LONG_SIDE * aspect));
  const ch = aspect >= 1 ? Math.max(64, Math.round(LONG_SIDE / aspect)) : LONG_SIDE;
  const key = `${label}|${tintHex}|${kind}|${cw}x${ch}|${id}`;
  const cached = labelTextureCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const tint = toRgb(tintHex);
  if (kind === "sky") drawSky(ctx, cw, ch, label, id);
  else if (kind === "frame") drawFrame(ctx, cw, ch, tint, label, id);
  else if (kind === "figure") drawFigure(ctx, cw, ch, tint, label, id);
  else drawPlain(ctx, cw, ch, tint, label, id);

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  labelTextureCache.set(key, tex);
  return tex;
}

function layerKind(id: string): LabelKind {
  if (id.endsWith("-sky")) return "sky";
  if (id.endsWith("-frame")) return "frame";
  if (id.endsWith("-figure")) return "figure";
  return "plain";
}

function LabelPlane({ def }: { def: PaperLayerDef }) {
  const tint = def.tint ?? "#6b4a44";
  const label = def.label ?? def.id;
  const kind = layerKind(def.id);
  const tex = useMemo(
    () => makeLabelTexture(kind, label, def.id, tint, def.w, def.h),
    [kind, label, def.id, tint, def.w, def.h]
  );
  return (
    <mesh position={[0, def.h / 2, 0]}>
      <planeGeometry args={[def.w, def.h]} />
      {tex ? (
        <meshBasicMaterial map={tex} transparent alphaTest={0.02} side={DoubleSide} toneMapped={false} />
      ) : (
        <meshBasicMaterial color={tint} side={DoubleSide} toneMapped={false} />
      )}
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
            <Suspense fallback={<LabelPlane def={def} />}>
              <TexturedPlane src={def.src} w={def.w} h={def.h} />
            </Suspense>
          ) : (
            <LabelPlane def={def} />
          )}
        </group>
      </group>
    </group>
  );
}
