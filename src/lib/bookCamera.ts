// 뷰(면 정면 / 방 안) → 카메라 자세. 렌더 무관 순수 함수.
import { PAGE_H, PAGE_W, type BookRoomDef } from "./homeBook";

export const PAGE_GAP = 2;
/** 캔버스 세로 화각(도) — Canvas의 camera.fov와 반드시 같아야 한다 */
const FOV_DEG = 40;
/** 면 폭 바깥으로 두는 여백 비율 */
const FIT_MARGIN = 1.12;
/** 가로 화면 기준 최소 거리 (너무 가까우면 위아래 여백이 사라진다) */
const MIN_DIST = 19;

export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
}

export function pageOffsetX(pageIndex: number): number {
  return pageIndex * (PAGE_W + PAGE_GAP);
}

/**
 * 화면 비율(가로/세로)에 맞춰 면 폭이 다 들어오는 카메라 거리.
 * 세로 화각은 고정이므로 좁은 화면일수록 가로 화각이 줄어 더 멀리 물러나야 한다.
 */
export function pageDistance(aspect: number): number {
  const halfFov = (FOV_DEG / 2) * (Math.PI / 180);
  const fitWidth = ((PAGE_W / 2) / (Math.tan(halfFov) * Math.max(0.2, aspect))) * FIT_MARGIN;
  return Math.max(MIN_DIST, fitWidth);
}

export function pageCamera(pageIndex: number, aspect: number): CameraPose {
  const x = pageOffsetX(pageIndex);
  const y = PAGE_H / 2;
  return {
    position: [x, y + 1.2, pageDistance(aspect)],
    target: [x, y, 0],
  };
}

export function roomCamera(room: BookRoomDef, pageIndex: number): CameraPose {
  const ox = pageOffsetX(pageIndex);
  const { x, y, z } = room.cameraIn;
  return {
    position: [ox + x, y, z],
    target: [ox + x, y - 0.2, z - 3],
  };
}

export function easeInOutCubic(t: number): number {
  const k = Math.min(1, Math.max(0, t));
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
}
