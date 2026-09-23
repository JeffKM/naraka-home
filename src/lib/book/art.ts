import type { BookId } from "./books";

// 책 홈 그림 레지스트리 — src가 null이면 ArtPlate가 라벨 판으로 대신 그린다.
// 파일은 scripts/book-art/process.py가 만든다 (원장: docs/book-art/PROMPTS.md)
export type ArtKey =
  | "gate" | "gate-m" | "office" | "office-m" | "shelf" | "desk" | "desk-m"
  | "hand-pull" | "hand-open" | "okja-shadow" | "mahjong" | "map" | "corner" | "bookmark"
  | `cover-${BookId}` | `spine-${BookId}`;

export interface ArtDef {
  label: string;
  src: string | null;
}

export const ART: Record<ArtKey, ArtDef> = {
  gate: { label: "지옥문", src: "/home/book/art/gate.webp" },
  "gate-m": { label: "지옥문 (세로)", src: "/home/book/art/gate-m.webp" },
  office: { label: "옥자의 집무실", src: "/home/book/art/office.webp" },
  "office-m": { label: "옥자의 집무실 (세로)", src: "/home/book/art/office-m.webp" },
  shelf: { label: "책장", src: "/home/book/art/shelf.webp" },
  desk: { label: "책상", src: "/home/book/art/desk.webp" },
  "desk-m": { label: "책상 (세로)", src: "/home/book/art/desk-m.webp" },
  "hand-pull": { label: "옥자의 손 — 꺼내기", src: "/home/book/art/hand-pull.webp" },
  "hand-open": { label: "옥자의 손 — 펼치기", src: "/home/book/art/hand-open.webp" },
  "okja-shadow": { label: "옥자의 그림자", src: "/home/book/art/okja-shadow.webp" },
  mahjong: { label: "마작 탁자", src: "/home/book/art/mahjong.webp" },
  map: { label: "손그림 지도", src: "/home/book/art/map.webp" },
  corner: { label: "모서리 장식", src: "/home/book/art/corner.webp" },
  bookmark: { label: "책갈피", src: "/home/book/art/bookmark.webp" },
  "cover-home": { label: "표지 — 나라카", src: "/home/book/art/cover-home.webp" },
  "cover-about": { label: "표지 — 소개", src: "/home/book/art/cover-about.webp" },
  "cover-location": { label: "표지 — 오시는 길", src: "/home/book/art/cover-location.webp" },
  "cover-menu": { label: "표지 — 메뉴", src: "/home/book/art/cover-menu.webp" },
  "cover-staff": { label: "표지 — 요괴", src: "/home/book/art/cover-staff.webp" },
  "cover-notice": { label: "표지 — 공지", src: "/home/book/art/cover-notice.webp" },
  "cover-events": { label: "표지 — 이벤트", src: "/home/book/art/cover-events.webp" },
  "cover-games": { label: "표지 — 게임", src: "/home/book/art/cover-games.webp" },
  "spine-home": { label: "나라카", src: "/home/book/art/spine-home.webp" },
  "spine-about": { label: "소개", src: "/home/book/art/spine-about.webp" },
  "spine-location": { label: "길", src: "/home/book/art/spine-location.webp" },
  "spine-menu": { label: "메뉴", src: "/home/book/art/spine-menu.webp" },
  "spine-staff": { label: "요괴", src: "/home/book/art/spine-staff.webp" },
  "spine-notice": { label: "공지", src: "/home/book/art/spine-notice.webp" },
  "spine-events": { label: "이벤트", src: "/home/book/art/spine-events.webp" },
  "spine-games": { label: "게임", src: "/home/book/art/spine-games.webp" },
};

// 스토리 원화 (캐러셀 UI 크롭 완료본, 840px 정사각)
export function storySrc(n: number): string {
  return `/story/comic/${String(n).padStart(2, "0")}.webp`;
}

// 인트로 영상 — Task 12에서 채운다. null이면 정지 그림 인트로
export const INTRO_VIDEO: { desktop: string; mobile: string } | null = null;

// 책 교체·인트로에 쓰는 그림을 뒤에서 미리 받는다 (브라우저 전용)
const PRELOAD_KEYS: readonly ArtKey[] = [
  "shelf", "hand-pull", "office", "office-m",
  "cover-home", "cover-about", "cover-location", "cover-menu",
  "cover-staff", "cover-notice", "cover-events", "cover-games",
  "spine-home", "spine-about", "spine-location", "spine-menu",
  "spine-staff", "spine-notice", "spine-events", "spine-games",
];

// 가로/세로 짝 그림 — 화면에 맞는 한 벌만 받는다 (ArtPicture의 768px 분기와 같은 기준)
const DESKTOP_ONLY: ReadonlySet<ArtKey> = new Set<ArtKey>(["office"]);
const MOBILE_ONLY: ReadonlySet<ArtKey> = new Set<ArtKey>(["office-m"]);

export function preloadArt(): void {
  const wide = window.matchMedia("(min-width: 768px)").matches;
  for (const key of PRELOAD_KEYS) {
    if (wide ? MOBILE_ONLY.has(key) : DESKTOP_ONLY.has(key)) continue;
    const src = ART[key].src;
    if (!src) continue;
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  }
}
