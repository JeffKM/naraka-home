import type { BookPose } from "./book";

// 책 교체 타임라인 — 시간(ms, 1배속) → 책 두 권·손·카메라 자세. 순수 함수라 단위 테스트한다.
// 덮기(펼친 묶음이 먼저 떨어지고 표지가 뒤따라 덮이며 살짝 튄다) → 카메라가 물러나 책상이 보이고 →
// 덮은 책은 왼쪽으로 밀려 나가고 옥자 손이 새 책을 밀어 넣는다 → 손이 앞표지 끝을 잡아 세우다 놓으면
// 표지가 제 무게로 넘어가고, 묶음과 낱장이 한 박자씩 늦게 따라 떨어진다 → 카메라가 다가간다.

const PI = Math.PI;
const LIFT_TO = 1.25; // 손이 표지를 세우는 각도 (약 72°)

export const TL = {
  closeLift: [0, 300],
  closeFall: [300, 500],
  closeBounce: [500, 600],
  closeGutter: [80, 460],
  camOut: [150, 760],
  slide: [700, 1080],
  grip: [1080, 1240],
  lift: [1240, 1460],
  openFall: [1460, 1620],
  openBounce: [1620, 1720],
  bundleFall: [1470, 1660],
  sheetFall: [
    [1490, 1700],
    [1520, 1750],
    [1550, 1800],
  ],
  openGutter: [1500, 1760],
  handOut: [1460, 1680],
  camIn: [1360, 1920],
  end: 1920,
} as const;

type Span = readonly [number, number];

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const seg = (t: number, [a, b]: Span) => clamp01((t - a) / (b - a));
const inOutSine = (u: number) => 0.5 - 0.5 * Math.cos(PI * u);
const inQuad = (u: number) => u * u;
const inCubic = (u: number) => u * u * u;
const outCubic = (u: number) => 1 - (1 - u) ** 3;
const inOutCubic = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);
const hump = (u: number) => Math.sin(PI * u);
// 떨어져 닿은 뒤 한 번 튀었다 가라앉는 양 (0 → 최대 → 0)
const bounce = (u: number, amp: number) => (u <= 0 || u >= 1 ? 0 : amp * Math.sin(PI * u) * (1 - u));

// 덮는 책
export function closingPose(t: number): BookPose {
  let cover: number;
  const lift = seg(t, TL.closeLift);
  const fall = seg(t, TL.closeFall);
  if (t < TL.closeFall[0]) cover = PI - (PI / 2) * inOutSine(lift);
  else cover = (PI / 2) * (1 - inQuad(fall)) + bounce(seg(t, TL.closeBounce), 0.07);
  // 펼친 묶음은 표지보다 먼저 떨어진다 (닫히는 쪽이 앞) — 표지보다 각도가 작다
  const falling = 0.25 + 0.75 * inOutSine(seg(t, [TL.closeFall[0] - 80, TL.closeFall[0] + 40]));
  const lead = 0.22 * Math.sin(cover) * falling;
  const bundle = Math.max(0, cover - lead);
  const bend = 0.55 * Math.sin(bundle) * falling;
  return { cover, bundle, bend, gutter: 1 - inOutSine(seg(t, TL.closeGutter)), sheets: [] };
}

// 펼치는 책
export function openingPose(t: number): BookPose {
  let cover: number;
  if (t < TL.openFall[0]) cover = LIFT_TO * inOutSine(seg(t, TL.lift));
  else if (t < TL.openBounce[0]) cover = LIFT_TO + (PI - LIFT_TO) * inQuad(seg(t, TL.openFall));
  else cover = PI - bounce(seg(t, TL.openBounce), 0.06);
  // 손이 잡고 있는 동안엔 묶음이 표지와 함께, 놓으면 한 박자 늦게 떨어진다
  const bundle = t < TL.openFall[0] ? cover : Math.min(cover, LIFT_TO + (PI - LIFT_TO) * inQuad(seg(t, TL.bundleFall)));
  const fallU = seg(t, TL.bundleFall);
  const bend = 0.7 * Math.sin(bundle) * hump(fallU);
  const sheets = TL.sheetFall.map((span, i) => {
    const u = seg(t, span);
    const angle = t < span[0] ? bundle : Math.min(bundle, LIFT_TO + (PI - LIFT_TO) * inQuad(u));
    return { angle: u >= 1 ? bundle : angle, bend: (0.9 + 0.35 * i) * Math.sin(angle) * hump(u) };
  });
  return { cover, bundle, bend, gutter: inOutSine(seg(t, TL.openGutter)), sheets };
}

// 카메라: 0 = 펼친 책을 위에서 가까이, 1 = 책상 전경
export function deskness(t: number) {
  if (t < TL.camIn[0]) return inOutCubic(seg(t, TL.camOut));
  return 1 - inOutCubic(seg(t, TL.camIn));
}

// 책상 위 책 자리 (x 이동, 몸 돌림)
const OFF = 6;
export function fromPlace(t: number) {
  const u = seg(t, TL.slide);
  return { x: -OFF * inCubic(u), yaw: -0.1 * deskness(t) - 0.25 * inCubic(u) };
}
export function toPlace(t: number) {
  const u = outCubic(seg(t, [TL.slide[0] + 60, TL.slide[1]]));
  const settle = t < TL.camIn[0] ? 1 : deskness(t);
  return { x: OFF * (1 - u), yaw: 0.28 * (1 - u) - 0.1 * settle, visible: t >= TL.slide[0] };
}
// 교체 중 카메라가 옆으로 살짝 흐른다 (책상 겹 시차)
export const slideDrift = (t: number) => hump(seg(t, TL.slide));

// 옥자 손 — 새 책을 밀어 넣고(push) → 앞표지 끝으로 옮겨(grip) → 표지와 함께 세우다(lift) → 놓고 거둔다(out)
export type HandPhase = "hidden" | "push" | "grip" | "lift" | "out";
export function handPhase(t: number): { phase: HandPhase; u: number } {
  if (t < TL.slide[0] || t >= TL.handOut[1]) return { phase: "hidden", u: 0 };
  if (t < TL.grip[0]) return { phase: "push", u: seg(t, TL.slide) };
  if (t < TL.lift[0]) return { phase: "grip", u: inOutSine(seg(t, TL.grip)) };
  if (t < TL.handOut[0]) return { phase: "lift", u: seg(t, TL.lift) };
  return { phase: "out", u: inCubic(seg(t, TL.handOut)) };
}
