// 뷰(면 정면 / 방 안) → 카메라 자세. 렌더 무관 순수 함수.
import { PAGE_H, PAGE_W, type BookRoomDef } from "./homeBook";

export const PAGE_GAP = 2;
/** 정면 카메라 거리 — 가로 화면. FOV 40°에서 면 폭이 화면에 들어오는 거리 */
const PAGE_DIST_LANDSCAPE = 19;
/** 세로 화면 — 폭을 맞추려면 더 멀리 */
const PAGE_DIST_PORTRAIT = 30;

export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
}

export function pageOffsetX(pageIndex: number): number {
  return pageIndex * (PAGE_W + PAGE_GAP);
}

export function pageCamera(pageIndex: number, portrait: boolean): CameraPose {
  const x = pageOffsetX(pageIndex);
  const y = PAGE_H / 2;
  return {
    position: [x, y + 1.2, portrait ? PAGE_DIST_PORTRAIT : PAGE_DIST_LANDSCAPE],
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
