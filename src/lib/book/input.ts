// 휠·스와이프·키보드 → 쪽 넘김 판정 (DOM 없는 순수 함수)
export type FlipDir = 1 | -1;

export interface ScrollBox {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

export const WHEEL_MIN_DELTA = 4;
export const WHEEL_GESTURE_GAP_MS = 250; // 이보다 벌어져야 "새 제스처" (트랙패드 관성 차단)
export const SWIPE_MIN_PX = 50;

function hasOverflow(b: ScrollBox): boolean {
  return b.scrollHeight - b.clientHeight > 1;
}
function atStart(b: ScrollBox): boolean {
  return b.scrollTop <= 0;
}
function atEnd(b: ScrollBox): boolean {
  return b.scrollTop + b.clientHeight >= b.scrollHeight - 1;
}

export interface WheelState {
  armedDir: FlipDir | null; // 끝에 닿아 다음 제스처를 기다리는 방향
  lastWheelAt: number;
  lockedUntil: number; // 넘김 애니메이션 종료 시각
}

export type WheelDecision =
  | { action: "ignore" }
  | { action: "scroll" }
  | { action: "arm"; dir: FlipDir }
  | { action: "flip"; dir: FlipDir };

// 호출자는 모든 이벤트마다 state.lastWheelAt = now 로 갱신하고,
// scroll → armedDir=null, arm → armedDir=dir, flip → armedDir=null 로 반영한다
export function decideWheel(
  deltaY: number,
  box: ScrollBox | null,
  state: WheelState,
  now: number
): WheelDecision {
  if (now < state.lockedUntil) return { action: "ignore" };
  if (Math.abs(deltaY) < WHEEL_MIN_DELTA) return { action: "ignore" };
  const dir: FlipDir = deltaY > 0 ? 1 : -1;
  const newGesture = now - state.lastWheelAt > WHEEL_GESTURE_GAP_MS;
  if (!box || !hasOverflow(box)) return newGesture ? { action: "flip", dir } : { action: "ignore" };
  const canScroll = dir === 1 ? !atEnd(box) : !atStart(box);
  if (canScroll) return { action: "scroll" };
  if (state.armedDir === dir && newGesture) return { action: "flip", dir };
  return { action: "arm", dir };
}

export interface SwipeStart {
  y: number;
  box: ScrollBox | null; // 터치 시작 시점의 스크롤 칸 상태
}

// 위로 밀기 = 다음 쪽. 쪽 안 스크롤이 남아 있으면 스크롤에 양보한다
export function decideSwipe(start: SwipeStart, endY: number): FlipDir | null {
  const dy = start.y - endY;
  if (Math.abs(dy) < SWIPE_MIN_PX) return null;
  const dir: FlipDir = dy > 0 ? 1 : -1;
  if (!start.box || !hasOverflow(start.box)) return dir;
  const edgeReached = dir === 1 ? atEnd(start.box) : atStart(start.box);
  return edgeReached ? dir : null;
}

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export function keyToDir(key: string, targetTag: string, isEditable: boolean): FlipDir | null {
  if (isEditable || EDITABLE_TAGS.has(targetTag)) return null;
  if (key === "ArrowRight" || key === "PageDown") return 1;
  if (key === "ArrowLeft" || key === "PageUp") return -1;
  return null;
}
