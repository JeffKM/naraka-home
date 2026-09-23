import { BOOKS, type BookId } from "./books";

// 책장 그림(shelf.webp) 위에 책등 8권을 꽂을 자리 — 그림 픽셀을 재서 잡은 값.
// 그림을 바꾸면(리테이크) 칸 경계를 다시 잰다: 가운데 줄 세로 칸 8개의 검은 윤곽선 안쪽 가장자리
export const SHELF_ART_SIZE = { w: 1128, h: 1400 } as const;

// 칸 [왼쪽, 오른쪽] 안쪽 가장자리 (px, BOOKS 순서)
export const SHELF_SLOT_X: readonly (readonly [number, number])[] = [
  [169, 244],
  [270, 346],
  [372, 449],
  [475, 552],
  [576, 653],
  [679, 755],
  [782, 858],
  [884, 959],
];

// 칸 위·아래 안쪽 가장자리 (px) — 책등은 아래(칸 바닥)에 붙여 세운다
export const SHELF_SLOT_Y = { top: 721, bottom: 1010 } as const;

// 책등 그림 크기 (px, public/home/book/art/spine-*.webp) — 칸 안에 비율 그대로 맞춘다
export const SPINE_SIZE: Record<BookId, { w: number; h: number }> = {
  home: { w: 107, h: 400 },
  about: { w: 116, h: 400 },
  location: { w: 100, h: 400 },
  menu: { w: 84, h: 400 },
  staff: { w: 138, h: 400 },
  notice: { w: 85, h: 400 },
  events: { w: 112, h: 400 },
  games: { w: 98, h: 400 },
};

// 책등이 칸 높이에서 차지하는 최대 비율 — 칸 위에 손가락 걸 틈을 남긴다
export const SPINE_FILL = 0.94;

// 책장 그림 기준 백분율 사각형 (left·top·width·height, 0~100)
export interface PctRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// 칸 가로 범위 (그림 px) — 없는 칸이면 던진다. shelfSlotRect·spineRect가 같은 가드를 쓴다
function slotX(index: number): readonly [number, number] {
  const slot = SHELF_SLOT_X[index];
  if (!slot) throw new Error(`없는 책장 칸: ${index}`);
  return slot;
}

// 칸 전체 사각형
export function shelfSlotRect(index: number): PctRect {
  const [x1, x2] = slotX(index);
  return {
    left: round2((x1 / SHELF_ART_SIZE.w) * 100),
    top: round2((SHELF_SLOT_Y.top / SHELF_ART_SIZE.h) * 100),
    width: round2(((x2 - x1) / SHELF_ART_SIZE.w) * 100),
    height: round2(((SHELF_SLOT_Y.bottom - SHELF_SLOT_Y.top) / SHELF_ART_SIZE.h) * 100),
  };
}

// 책등이 실제로 서는 사각형 — 칸 안에 contain으로 맞추고 가로 가운데·아래 정렬
export function spineRect(book: BookId): PctRect {
  const [x1, x2] = slotX(BOOKS.findIndex((b) => b.id === book));
  const slotW = x2 - x1;
  const slotH = SHELF_SLOT_Y.bottom - SHELF_SLOT_Y.top;
  const spine = SPINE_SIZE[book];
  const scale = Math.min(slotW / spine.w, (slotH * SPINE_FILL) / spine.h);
  const w = spine.w * scale;
  const h = spine.h * scale;
  const left = x1 + (slotW - w) / 2;
  const top = SHELF_SLOT_Y.bottom - h;
  return {
    left: round2((left / SHELF_ART_SIZE.w) * 100),
    top: round2((top / SHELF_ART_SIZE.h) * 100),
    width: round2((w / SHELF_ART_SIZE.w) * 100),
    height: round2((h / SHELF_ART_SIZE.h) * 100),
  };
}

// 사각형 가운데 (책장 그림 기준 %) — 표지가 칸에서 화면 가운데로 나오는 출발점
export function rectCenter(r: PctRect): { x: number; y: number } {
  return { x: round2(r.left + r.width / 2), y: round2(r.top + r.height / 2) };
}
