// 팝업북 홈 — 면·공간·판 정의 (데이터만, 렌더 무관)
// 좌표계: 면 하나가 가로 PAGE_W × 세로 PAGE_H 월드 단위. 원점 = 면 바닥 중앙. z는 카메라 쪽이 +.

export const PAGE_W = 16;
export const PAGE_H = 9;

export type Hinge = "bottom" | "left" | "right";

export interface PaperLayerDef {
  id: string;
  /** public 경로. null이면 임시 단색 판 (에셋 전 뼈대용) */
  src: string | null;
  /** 월드 단위 크기 */
  w: number;
  h: number;
  /** 판 경첩 위치 (bottom: 아래 변 중앙, left/right: 세로 변 아래) */
  x: number;
  y: number;
  z: number;
  hinge: Hinge;
  /** 면 열림 진행도(0~1) 중 이 판이 일어서기 시작하는 시점 */
  open: number;
  /** 일어서는 데 쓰는 진행도 길이 */
  duration: number;
  /** 임시 판 색 (src null일 때) */
  tint?: string;
}

export interface BookRoomDef {
  id: string;
  pageId: BookPageId;
  /** 명패 문안 */
  label: string;
  /** 정보 패널 제목 */
  title: string;
  /** "더 보기" 목적지 */
  href: string;
  hrefLabel: string;
  /** 명패 위치 (면 좌표) */
  plate: { x: number; y: number };
  /** 방 안 카메라 도착점 (면 좌표) */
  cameraIn: { x: number; y: number; z: number };
  /** 터널북 겹 — z 오름차순 (뒤→앞) */
  layers: PaperLayerDef[];
}

export type BookPageId = "p1" | "p2" | "p3";

export interface BookPageDef {
  id: BookPageId;
  act: string;
  /** 경첩 감옥 빗금 수 — 이 면의 끝(다음 면과의 경첩)에 선다 */
  jailTally: 5 | 10 | 15;
  layers: PaperLayerDef[];
}

const layer = (
  id: string,
  partial: Partial<PaperLayerDef> & Pick<PaperLayerDef, "w" | "h" | "x" | "y" | "z">
): PaperLayerDef => ({
  id,
  src: null,
  hinge: "bottom",
  open: 0.3,
  duration: 0.3,
  ...partial,
});

// 방 내부 겹 5종 공통 배치 — 뒤(창밖)부터 앞(문틀)까지
const roomLayers = (roomId: string, tint: string): PaperLayerDef[] => [
  layer(`${roomId}-window`, { w: 6, h: 4, x: 0, y: 0, z: -2.4, open: 0, duration: 0.01, tint: "#131117" }),
  layer(`${roomId}-wall`, { w: 6.4, h: 4.4, x: 0, y: 0, z: -1.8, open: 0, duration: 0.01, tint }),
  layer(`${roomId}-furniture`, { w: 5, h: 3, x: 0, y: 0, z: -1.0, open: 0.5, duration: 0.3, tint: "#3a2a26" }),
  layer(`${roomId}-figure`, { w: 2.2, h: 2.6, x: -0.8, y: 0, z: -0.4, open: 0.7, duration: 0.3, tint: "#d1b89d" }),
  layer(`${roomId}-frame`, { w: 7, h: 5, x: 0, y: 0, z: 0, open: 0.3, duration: 0.3, tint: "#6b4a44" }),
];

export const BOOK_PAGES: BookPageDef[] = [
  {
    id: "p1",
    act: "프롤로그·1막",
    jailTally: 5,
    layers: [
      layer("p1-sky", { w: PAGE_W, h: PAGE_H, x: 0, y: 0, z: -3, open: 0, duration: 0.01, tint: "#0d0c11" }),
      layer("p1-ground", { w: PAGE_W, h: 4, x: 0, y: 0, z: -2.5, hinge: "bottom", open: 0.05, duration: 0.2, tint: "#3a2a26" }),
      layer("p1-office", { w: 5.5, h: 5, x: -4.2, y: 0, z: -1.5, open: 0.3, duration: 0.3, tint: "#6b4a44" }),
      layer("p1-vault", { w: 4.5, h: 4.2, x: 4, y: 0, z: -1.5, open: 0.4, duration: 0.3, tint: "#515151" }),
      layer("p1-props", { w: 3, h: 2, x: 0.5, y: 0, z: -0.8, open: 0.6, duration: 0.3, tint: "#757f70" }),
    ],
  },
  {
    id: "p2",
    act: "2막",
    jailTally: 10,
    layers: [
      layer("p2-sky", { w: PAGE_W, h: PAGE_H, x: 0, y: 0, z: -3, open: 0, duration: 0.01, tint: "#0d0c11" }),
      layer("p2-ground", { w: PAGE_W, h: 4, x: 0, y: 0, z: -2.5, open: 0.05, duration: 0.2, tint: "#3a2a26" }),
      layer("p2-street", { w: 7, h: 5.5, x: -3.5, y: 0, z: -1.5, open: 0.3, duration: 0.3, tint: "#16151c" }),
      layer("p2-house", { w: 5, h: 4.8, x: 4.2, y: 0, z: -1.5, open: 0.4, duration: 0.3, tint: "#6b4a44" }),
      layer("p2-props", { w: 3, h: 2, x: 0.5, y: 0, z: -0.8, open: 0.6, duration: 0.3, tint: "#757f70" }),
    ],
  },
  {
    id: "p3",
    act: "3막·피날레",
    jailTally: 15,
    layers: [
      layer("p3-sky", { w: PAGE_W, h: PAGE_H, x: 0, y: 0, z: -3, open: 0, duration: 0.01, tint: "#0d0c11" }),
      layer("p3-ground", { w: PAGE_W, h: 4, x: 0, y: 0, z: -2.5, open: 0.05, duration: 0.2, tint: "#3a2a26" }),
      layer("p3-field", { w: 5, h: 3.5, x: -5.5, y: 0, z: -1.6, open: 0.3, duration: 0.3, tint: "#757f70" }),
      layer("p3-jail", { w: 3, h: 4, x: -1.5, y: 0, z: -1.4, open: 0.4, duration: 0.3, tint: "#515151" }),
      layer("p3-cafe", { w: 5, h: 5.2, x: 2.5, y: 0, z: -1.5, open: 0.5, duration: 0.3, tint: "#6b4a44" }),
      layer("p3-plaza", { w: 3, h: 3.5, x: 6.2, y: 0, z: -1.2, open: 0.6, duration: 0.3, tint: "#d1b89d" }),
    ],
  },
];

export const BOOK_ROOMS: BookRoomDef[] = [
  { id: "office", pageId: "p1", label: "사무소", title: "마녀의 사무소", href: "/about", hrefLabel: "나라카 이야기 보기",
    plate: { x: -4.2, y: 5.4 }, cameraIn: { x: -4.2, y: 2.2, z: 2.2 }, layers: roomLayers("office", "#6b4a44") },
  { id: "vault", pageId: "p1", label: "금고", title: "금고", href: "/games", hrefLabel: "놀거리 보기",
    plate: { x: 4, y: 4.6 }, cameraIn: { x: 4, y: 2, z: 2.2 }, layers: roomLayers("vault", "#515151") },
  { id: "street", pageId: "p2", label: "간판 거리", title: "「나라카」 간판 거리", href: "/about", hrefLabel: "릴스 보기",
    plate: { x: -3.5, y: 5.9 }, cameraIn: { x: -3.5, y: 2.4, z: 2.2 }, layers: roomLayers("street", "#16151c") },
  { id: "house", pageId: "p2", label: "마녀의 집", title: "마녀의 집", href: "https://instagram.com/naraka_concafe", hrefLabel: "영업시간은 인스타그램에서",
    plate: { x: 4.2, y: 5.2 }, cameraIn: { x: 4.2, y: 2.1, z: 2.2 }, layers: roomLayers("house", "#6b4a44") },
  { id: "field", pageId: "p3", label: "호박밭", title: "호박밭", href: "/location", hrefLabel: "오시는 길",
    plate: { x: -5.5, y: 3.9 }, cameraIn: { x: -5.5, y: 1.6, z: 2.2 }, layers: roomLayers("field", "#757f70") },
  { id: "jail", pageId: "p3", label: "휴게실", title: "감옥, 아니 휴게실", href: "/staff", hrefLabel: "출근 요괴 보기",
    plate: { x: -1.5, y: 4.4 }, cameraIn: { x: -1.5, y: 1.8, z: 2.2 }, layers: roomLayers("jail", "#515151") },
  { id: "cafe", pageId: "p3", label: "카페 본관", title: "홀과 주방", href: "/menu", hrefLabel: "메뉴 보기",
    plate: { x: 2.5, y: 5.6 }, cameraIn: { x: 2.5, y: 2.3, z: 2.2 }, layers: roomLayers("cafe", "#6b4a44") },
  { id: "plaza", pageId: "p3", label: "광장", title: "단체사진 광장", href: "/notice", hrefLabel: "공지 보기",
    plate: { x: 6.2, y: 3.9 }, cameraIn: { x: 6.2, y: 1.6, z: 2.2 }, layers: roomLayers("plaza", "#d1b89d") },
];

/** 면 열림 진행도(0~1)에 대한 판의 일어섬 진행도(0~1) */
export function layerOpen(def: { open: number; duration: number }, pageOpen: number): number {
  const p = Math.min(1, Math.max(0, pageOpen));
  if (def.duration <= 0) return p >= def.open ? 1 : 0;
  // 부동소수점 오차(예: (0.7-0.4)/0.3 !== 1) 보정을 위해 소수 9자리로 반올림 후 클램프
  const raw = Math.round(((p - def.open) / def.duration) * 1e9) / 1e9;
  return Math.min(1, Math.max(0, raw));
}

export function roomsOfPage(pageId: BookPageId): BookRoomDef[] {
  return BOOK_ROOMS.filter((r) => r.pageId === pageId);
}

export function findRoom(id: string): BookRoomDef | undefined {
  return BOOK_ROOMS.find((r) => r.id === id);
}
